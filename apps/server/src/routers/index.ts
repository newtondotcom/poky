import { publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/pokes/search-users";
import { getUserPokesProcedure } from "@/procedures/pokes/get-user-pokes";
import { getUserAnonymizedDataProcedure, refreshAnonymizedNameProcedure, refreshAnonymizedPictureProcedure } from "@/procedures/leaderboard/user-anonymized-data";
import { pokeUserProcedure } from "@/procedures/pokes/poke-user";
import { getLeaderboardProcedure } from "@/procedures/leaderboard/get-leaderboard";
import { registerWebPushProcedure } from "@/procedures/webpush/register-webpush";
import { deleteWebPushProcedure } from "@/procedures/webpush/delete-webpush";
import { getWebPushProcedure } from "@/procedures/webpush/get-webpush";
import { togglePokeVisibilityProcedure } from "@/procedures/leaderboard/toggle-poke-visibility";
import { testWebPushProcedure } from "@/procedures/webpush/test-webpush";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  searchUsers: searchUsersProcedure,
  getUserPokes: getUserPokesProcedure,
  getUserAnonymizedData: getUserAnonymizedDataProcedure,
  refreshAnonymizedName: refreshAnonymizedNameProcedure,
  refreshAnonymizedPicture: refreshAnonymizedPictureProcedure,
  pokeUser: pokeUserProcedure,
  getLeaderboard: getLeaderboardProcedure,
  registerWebPush: registerWebPushProcedure,
  deleteWebPush: deleteWebPushProcedure,
  getWebPush: getWebPushProcedure,
  togglePokeVisibility: togglePokeVisibilityProcedure,
  testWebPush: testWebPushProcedure,
});
export type AppRouter = typeof appRouter;
