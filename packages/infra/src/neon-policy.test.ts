import { describe, expect, test } from "bun:test";
import config from "../../../neon";

describe("Neon branch lifecycle policy", () => {
  test("leaves long-lived and default branches untuned", () => {
    for (const name of ["development", "production"]) {
      for (const exists of [false, true]) {
        expect(config.branch?.({ name, exists, isDefault: false })).toEqual({});
      }
    }
    expect(
      config.branch?.({
        name: "another-default",
        exists: true,
        isDefault: true,
      })
    ).toEqual({});
  });

  test("expires and limits all other branches, including inherited object names", () => {
    for (const name of [
      "preview",
      "constructor",
      "toString",
      "hasOwnProperty",
      "__proto__",
    ]) {
      for (const exists of [false, true]) {
        expect(config.branch?.({ name, exists, isDefault: false })).toEqual({
          ttl: "7d",
          postgres: {
            computeSettings: {
              autoscalingLimitMinCu: 0.25,
              autoscalingLimitMaxCu: 0.25,
            },
          },
        });
      }
    }
  });
});
