import { protectedProcedure, publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  searchUsers: searchUsersProcedure,
});
export type AppRouter = typeof appRouter;
