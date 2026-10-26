import { describe, expect, test } from "bun:test";
import { Stage } from "alchemy";
import * as Output from "alchemy/Output";
import { InMemoryService } from "alchemy/State/InMemoryState";
import { State } from "alchemy/State/State";
import * as Effect from "effect/Effect";
import { workerName } from "./worker-name";

// Exercise Alchemy's real nested-props evaluator used before provider reconcile,
// not just the naming Effect: ordinary Effects in name are opaque to Alchemy.
// No stack, deploy secrets, or Cloudflare provider is invoked.
const namesForStage = (stage: string) =>
  Effect.runSync(
    Output.evaluate(
      {
        server: { name: workerName("server") },
        web: { name: workerName("web") },
      },
      {}
    ).pipe(
      // beta.83 types evaluate as the input shape; assert resolved values below.
      Effect.map((props): unknown[] => [props.server.name, props.web.name]),
      Effect.provideService(Stage, stage),
      Effect.provideService(State, InMemoryService())
    )
  );

describe("Worker names", () => {
  test("the production wrapper stage keeps stable names", () => {
    expect(namesForStage("production")).toEqual([
      "masterscorner-server-production",
      "masterscorner-web-production",
    ]);
  });

  test("personal and development stages leave names to Alchemy", () => {
    for (const stage of [
      "dev",
      "development",
      "alice",
      "preview",
      "Production",
    ]) {
      expect(namesForStage(stage)).toEqual([undefined, undefined]);
    }
  });

  test("NODE_ENV cannot override the resolved Alchemy stage", () => {
    const previous = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      expect(namesForStage("alice")).toEqual([undefined, undefined]);
      expect(namesForStage("dev")).toEqual([undefined, undefined]);

      process.env.NODE_ENV = "development";
      expect(namesForStage("production")).toEqual([
        "masterscorner-server-production",
        "masterscorner-web-production",
      ]);
    } finally {
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }
  });
});
