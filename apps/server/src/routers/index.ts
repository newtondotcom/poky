import { publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";
import { getUserPokesProcedure } from "@/procedures/get-user-pokes";
import { getUserAnonymizedDataProcedure } from "@/procedures/get-user-anonymized-data";
import { pokeUserProcedure } from "@/procedures/poke-user";
import { getLeaderboardProcedure } from "@/procedures/get-leaderboard";
import { registerWebPushProcedure } from "@/procedures/register-webpush";
import { deleteWebPushProcedure } from "@/procedures/delete-webpush";
import { getWebPushProcedure } from "@/procedures/get-webpush";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  searchUsers: searchUsersProcedure,
  getUserPokes: getUserPokesProcedure,
  getUserAnonymizedData: getUserAnonymizedDataProcedure,
  pokeUser: pokeUserProcedure,
  getLeaderboard: getLeaderboardProcedure,
  registerWebPush: registerWebPushProcedure,
  deleteWebPush: deleteWebPushProcedure,
  getWebPush: getWebPushProcedure,
});
export type AppRouter = typeof appRouter;
