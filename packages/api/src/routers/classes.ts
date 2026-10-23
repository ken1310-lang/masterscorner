import type { Database } from "@my-better-t-app/db";
import {
  masterClass,
  masterClassSchedule,
} from "@my-better-t-app/db/schema/classes";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import {
  type ClassesPayload,
  type ClassOption,
  classIdInputSchema,
  type MasterClassView,
  type SaveClassInput,
  saveClassInputSchema,
  setClassStatusInputSchema,
  toTimeInput,
} from "../classes";
import { protectedProcedure, router } from "../index";

interface ClassOptions {
  locations: ClassOption[];
  martialArts: ClassOption[];
  profileId: string;
}

async function loadOptions(
  db: Database,
  userId: string
): Promise<ClassOptions | null> {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    with: {
      locations: { orderBy: { position: "asc" } },
      martialArts: { orderBy: { position: "asc" } },
    },
  });
  if (!profile) {
    return null;
  }
  return {
    locations: profile.locations.map(({ id, name }) => ({ id, name })),
    martialArts: profile.martialArts.map(({ id, name }) => ({ id, name })),
    profileId: profile.id,
  };
}

async function profileIdForUser(db: Database, userId: string) {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    columns: { id: true },
  });
  return profile?.id;
}

function toClassView(row: {
  audience: MasterClassView["audience"];
  feeAmount: number | null;
  feePeriod: MasterClassView["feePeriod"];
  id: string;
  level: MasterClassView["level"];
  location: { id: string; name: string };
  martialArt: { id: string; name: string };
  name: string;
  schedules: {
    dayOfWeek: number;
    endTime: string;
    id: string;
    startTime: string;
  }[];
  status: MasterClassView["status"];
}): MasterClassView {
  return {
    audience: row.audience,
    feeAmount: row.feeAmount,
    feePeriod: row.feePeriod,
    id: row.id,
    level: row.level,
    location: { id: row.location.id, name: row.location.name },
    martialArt: { id: row.martialArt.id, name: row.martialArt.name },
    name: row.name,
    schedules: [...row.schedules]
      .sort(
        (left, right) =>
          left.dayOfWeek - right.dayOfWeek ||
          left.startTime.localeCompare(right.startTime)
      )
      .map((schedule) => ({
        dayOfWeek: schedule.dayOfWeek,
        endTime: toTimeInput(schedule.endTime),
        id: schedule.id,
        startTime: toTimeInput(schedule.startTime),
      })),
    status: row.status,
  };
}

async function loadClassView(
  db: Database,
  id: string,
  profileId: string
): Promise<MasterClassView | null> {
  const row = await db.query.masterClass.findFirst({
    where: { id, profileId },
    with: { location: true, martialArt: true, schedules: true },
  });
  return row ? toClassView(row) : null;
}

function postgresCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return;
  }
  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }
  if ("cause" in error) {
    return postgresCode(error.cause);
  }
}

function classWriteError(error: unknown) {
  const code = postgresCode(error);
  if (code === "23503") {
    return new TRPCError({
      code: "BAD_REQUEST",
      message:
        "The selected martial art, teaching location or class is no longer available. Reload and choose again.",
    });
  }
  if (code === "23505") {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "That weekly schedule is already in use.",
    });
  }
  if (code === "23514") {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "The class details are not valid.",
    });
  }
}

function validateReferences(options: ClassOptions, input: SaveClassInput) {
  if (!options.martialArts.some((art) => art.id === input.martialArtId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Choose one of your own martial arts.",
    });
  }
  if (!options.locations.some((location) => location.id === input.locationId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Choose one of your own teaching locations.",
    });
  }
}

export const classesRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<ClassesPayload> => {
    const options = await loadOptions(ctx.db, ctx.session.user.id);
    if (!options) {
      return { classes: [], locations: [], martialArts: [] };
    }
    const rows = await ctx.db.query.masterClass.findMany({
      where: { profileId: options.profileId },
      with: { location: true, martialArt: true, schedules: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      classes: rows.map(toClassView),
      locations: options.locations,
      martialArts: options.martialArts,
    };
  }),

  save: protectedProcedure
    .input(saveClassInputSchema)
    .mutation(async ({ ctx, input }) => {
      const options = await loadOptions(ctx.db, ctx.session.user.id);
      if (!options) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Add your master profile, a martial art and a teaching location before creating a class.",
        });
      }
      validateReferences(options, input);

      const id = input.id ?? crypto.randomUUID();
      const fields = {
        audience: input.audience,
        feeAmount: input.feeAmount,
        feePeriod: input.feePeriod,
        level: input.level,
        locationId: input.locationId,
        martialArtId: input.martialArtId,
        name: input.name,
        status: input.status,
      };
      let classWrite: BatchItem<"pg">;
      if (input.id) {
        const existing = await ctx.db.query.masterClass.findFirst({
          where: { id: input.id, profileId: options.profileId },
          columns: { id: true },
        });
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }
        classWrite = ctx.db
          .update(masterClass)
          .set(fields)
          .where(
            and(
              eq(masterClass.id, input.id),
              eq(masterClass.profileId, options.profileId)
            )
          )
          .returning({ id: masterClass.id });
      } else {
        classWrite = ctx.db
          .insert(masterClass)
          .values({
            ...fields,
            id,
            profileId: options.profileId,
          })
          .returning({ id: masterClass.id });
      }

      const statements: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [classWrite];
      if (input.id) {
        statements.push(
          ctx.db
            .delete(masterClassSchedule)
            .where(eq(masterClassSchedule.classId, id))
        );
      }
      statements.push(
        ctx.db.insert(masterClassSchedule).values(
          input.schedules.map((schedule) => ({
            classId: id,
            dayOfWeek: schedule.dayOfWeek,
            endTime: schedule.endTime,
            startTime: schedule.startTime,
          }))
        )
      );

      let guardRows: unknown;
      try {
        [guardRows] = await ctx.db.batch(statements);
      } catch (error) {
        const mapped = classWriteError(error);
        if (mapped) {
          throw mapped;
        }
        throw error;
      }
      if (!Array.isArray(guardRows) || guardRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }

      const saved = await loadClassView(ctx.db, id, options.profileId);
      if (!saved) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }
      return saved;
    }),

  setStatus: protectedProcedure
    .input(setClassStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const profileId = await profileIdForUser(ctx.db, ctx.session.user.id);
      if (!profileId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }
      const [updated] = await ctx.db
        .update(masterClass)
        .set({ status: input.status })
        .where(
          and(
            eq(masterClass.id, input.id),
            eq(masterClass.profileId, profileId)
          )
        )
        .returning({ id: masterClass.id, status: masterClass.status });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }
      return updated;
    }),

  remove: protectedProcedure
    .input(classIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const profileId = await profileIdForUser(ctx.db, ctx.session.user.id);
      if (!profileId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }
      const [removed] = await ctx.db
        .delete(masterClass)
        .where(
          and(
            eq(masterClass.id, input.id),
            eq(masterClass.profileId, profileId)
          )
        )
        .returning({ id: masterClass.id });
      if (!removed) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }
      return removed;
    }),
});
