import { protectedProcedure, publicProcedure, router } from "../index";
import { classesRouter } from "./classes";
import { masterRouter } from "./master";
import { mediaRouter } from "./media";

export const appRouter = router({
  classes: classesRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  master: masterRouter,
  media: mediaRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
});
export type AppRouter = typeof appRouter;
