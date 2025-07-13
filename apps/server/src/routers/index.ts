import { protectedProcedure, publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";
import { getUserPokesProcedure } from "@/procedures/get-user-pokes";
import { pokeUserProcedure } from "@/procedures/poke-user";

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
  getUserPokes: getUserPokesProcedure,
  pokeUser: pokeUserProcedure,
});
export type AppRouter = typeof appRouter;
