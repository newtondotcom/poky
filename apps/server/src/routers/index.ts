import { publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";
import { getUserPokesProcedure } from "@/procedures/get-user-pokes";
import { pokeUserProcedure } from "@/procedures/poke-user";
import { getLeaderboardProcedure } from "@/procedures/get-leaderboard";
import { registerWebPushProcedure } from "@/procedures/register-webpush";
import { deleteWebPushProcedure } from "@/procedures/delete-webpush";
import { getWebPushProcedure } from "@/procedures/get-webpush";
import { testWebPushProcedure } from "@/procedures/test-webpush";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  searchUsers: searchUsersProcedure,
  getUserPokes: getUserPokesProcedure,
  pokeUser: pokeUserProcedure,
  getLeaderboard: getLeaderboardProcedure,
  registerWebPush: registerWebPushProcedure,
  deleteWebPush: deleteWebPushProcedure,
  getWebPush: getWebPushProcedure,
  testWebPush: testWebPushProcedure,
});
export type AppRouter = typeof appRouter;
