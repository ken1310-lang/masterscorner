import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@my-better-t-app/api/routers/index";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { createAuth } from "./services";

const app = new Hono();

/**
 * A 5 MiB image is 6.99 MB of base64 plus a small JSON envelope (SPEC-media §3).
 * Capping the body before tRPC parses it keeps an oversized or hostile request
 * from occupying Worker memory before Zod can reject it.
 */
const TRPC_BODY_LIMIT = 8 * 1024 * 1024;

app.use(logger());
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", async (c) =>
  (await createAuth()).handler(c.req.raw)
);

app.use(
  "/trpc/*",
  bodyLimit({
    maxSize: TRPC_BODY_LIMIT,
    onError: (c) =>
      c.json(
        { error: { code: -32_600, message: "Request body is too large." } },
        413
      ),
  })
);

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  })
);

app.get("/", (c) => c.text("OK"));

export default app;
