import { publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";
import { getUserPokesProcedure } from "@/procedures/get-user-pokes";
import { pokeUserProcedure } from "@/procedures/poke-user";
import { getLeaderboardProcedure } from "@/procedures/get-leaderboard";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  searchUsers: searchUsersProcedure,
  getUserPokes: getUserPokesProcedure,
  pokeUser: pokeUserProcedure,
  getLeaderboard: getLeaderboardProcedure,
});
export type AppRouter = typeof appRouter;
