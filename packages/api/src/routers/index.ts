import { protectedProcedure, publicProcedure, router } from "../index";
import { classesRouter } from "./classes";
import { directoryRouter } from "./directory";
import { masterRouter } from "./master";
import { mediaRouter } from "./media";

export const appRouter = router({
  classes: classesRouter,
  directory: directoryRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  master: masterRouter,
  media: mediaRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
});
export type AppRouter = typeof appRouter;
