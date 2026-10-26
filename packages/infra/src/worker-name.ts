import { Stage } from "alchemy";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";

/** Only the resolved production stage may claim the stable production names. */
export const workerName = (role: "server" | "web") =>
  Output.fromEffect(
    Effect.map(Stage, (stage) =>
      stage === "production" ? `masterscorner-${role}-production` : undefined
    )
  );
