import { protectedProcedure, publicProcedure, router } from "../index";
import { masterRouter } from "./master";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  master: masterRouter,
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
});
export type AppRouter = typeof appRouter;
