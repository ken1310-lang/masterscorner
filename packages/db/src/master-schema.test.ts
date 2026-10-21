import { describe, expect, test } from "bun:test";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import { createDb } from "./index";
import {
  MEDIA_KINDS,
  masterLocation,
  masterMartialArt,
  masterProfile,
  media,
} from "./schema/master";

function foreignKey(table: PgTable, column: string) {
  return getTableConfig(table).foreignKeys.find(
    (key) => key.reference().columns[0]?.name === column
  );
}

function indexFor(table: PgTable, name: string) {
  return getTableConfig(table).indexes.find(
    (entry) => entry.config.name === name
  );
}

function sqlChunk(chunk: unknown): string {
  if (typeof chunk === "string") {
    return chunk;
  }
  const value = chunk as {
    name?: string;
    queryChunks?: unknown[];
    value?: string | string[];
  };
  if (Array.isArray(value.queryChunks)) {
    return value.queryChunks.map(sqlChunk).join("");
  }
  if (Array.isArray(value.value)) {
    return value.value.join("");
  }
  if (typeof value.value === "string") {
    return value.value;
  }
  return value.name ? `"${value.name}"` : "";
}

function checkSql(table: PgTable, name: string) {
  const entry = getTableConfig(table).checks.find(
    (candidate) => candidate.name === name
  );
  return (entry?.value.queryChunks ?? []).map(sqlChunk).join("");
}

function checkNames(table: PgTable) {
  return getTableConfig(table).checks.map((entry) => entry.name);
}

describe("master profile schema", () => {
  test("a profile has exactly one owner and cascades with the account", () => {
    expect(masterProfile.userId.notNull).toBe(true);
    expect(masterProfile.userId.isUnique).toBe(true);

    const owner = foreignKey(masterProfile, "user_id");
    expect(owner?.onDelete).toBe("cascade");
    expect(
      getTableConfig(owner?.reference().foreignTable as PgTable).name
    ).toBe("user");
    expect(owner?.reference().foreignColumns[0]?.name).toBe("id");
    expect(
      checkSql(masterProfile, "master_profile_display_name_check")
    ).toContain("btrim");
    expect(
      checkSql(masterProfile, "master_profile_display_name_check")
    ).toContain("> 0");
    expect(
      checkSql(masterProfile, "master_profile_years_teaching_check")
    ).toContain(">= 0");
  });

  test("locations, martial arts and media belong to one profile", () => {
    for (const table of [masterLocation, masterMartialArt, media]) {
      expect(table.profileId.notNull).toBe(true);
      const profile = foreignKey(table, "profile_id");
      expect(profile?.onDelete).toBe("cascade");
      expect(
        getTableConfig(profile?.reference().foreignTable as PgTable).name
      ).toBe("master_profile");
      expect(profile?.reference().foreignColumns[0]?.name).toBe("id");
    }
  });

  test("locations and martial arts keep a deterministic, non-negative order", () => {
    expect(masterLocation.position.notNull).toBe(true);
    expect(masterLocation.position.hasDefault).toBe(false);
    expect(masterMartialArt.position.notNull).toBe(true);
    expect(masterMartialArt.position.hasDefault).toBe(false);
    expect(
      indexFor(masterLocation, "master_location_profile_position_idx")?.config
        .unique
    ).toBe(true);
    expect(
      indexFor(masterMartialArt, "master_martial_art_profile_position_idx")
        ?.config.unique
    ).toBe(true);
    expect(
      indexFor(masterMartialArt, "master_martial_art_profile_name_idx")?.config
        .unique
    ).toBe(true);
    expect(checkNames(masterLocation)).toContain(
      "master_location_position_check"
    );
    expect(
      checkSql(masterLocation, "master_location_position_check")
    ).toContain(">= 0");
    expect(
      checkSql(masterMartialArt, "master_martial_art_position_check")
    ).toContain(">= 0");
    expect(checkSql(masterLocation, "master_location_name_check")).toContain(
      "btrim"
    );
    expect(checkSql(masterLocation, "master_location_name_check")).toContain(
      "> 0"
    );
    expect(
      checkSql(masterMartialArt, "master_martial_art_name_check")
    ).toContain("btrim");
    expect(
      checkSql(masterMartialArt, "master_martial_art_name_check")
    ).toContain("> 0");
  });

  test("media rejects unknown roles and empty objects", () => {
    expect(media.objectKey.notNull).toBe(true);
    expect(media.objectKey.isUnique).toBe(true);
    expect(media.byteSize.notNull).toBe(true);
    expect(indexFor(media, "media_profile_idx")?.config.unique).toBe(false);
    expect(checkNames(media)).toEqual(
      expect.arrayContaining(["media_kind_check", "media_byte_size_check"])
    );
    for (const kind of MEDIA_KINDS) {
      expect(checkSql(media, "media_kind_check")).toContain(`'${kind}'`);
    }
    expect(checkSql(media, "media_byte_size_check")).toContain("> 0");
  });

  test("createDb exposes the profile and its children", () => {
    const db = createDb({
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/db",
    });
    const { sql } = db.query.masterProfile
      .findFirst({
        with: {
          user: true,
          locations: true,
          martialArts: true,
          media: true,
        },
      })
      .toSQL();

    for (const table of [
      "master_profile",
      "user",
      "master_location",
      "master_martial_art",
      "media",
    ]) {
      expect(sql).toContain(`"${table}"`);
    }
    expect(sql).toContain('"d0"."user_id" = "d1"."id"');
    expect(sql.match(/"d0"\."id" = "d1"\."profile_id"/g)).toHaveLength(3);

    const authSql = db.query.user
      .findFirst({ with: { sessions: true, accounts: true } })
      .toSQL().sql;
    expect(authSql).toContain('"session"');
    expect(authSql).toContain('"account"');
  });
});
