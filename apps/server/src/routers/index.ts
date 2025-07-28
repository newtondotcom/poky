import { publicProcedure, router } from "@/lib/trpc";
import { searchUsersProcedure } from "@/procedures/search-users";
import { getUserPokesProcedure } from "@/procedures/get-user-pokes";
import { getUserAnonymizedDataProcedure, refreshAnonymizedNameProcedure, refreshAnonymizedPictureProcedure } from "@/procedures/user-anonymized-data";
import { pokeUserProcedure } from "@/procedures/poke-user";
import { getLeaderboardProcedure } from "@/procedures/get-leaderboard";
import { registerWebPushProcedure } from "@/procedures/register-webpush";
import { deleteWebPushProcedure } from "@/procedures/delete-webpush";
import { getWebPushProcedure } from "@/procedures/get-webpush";
import { togglePokeVisibilityProcedure } from "@/procedures/toggle-poke-visibility";
import { testWebPushProcedure } from "@/procedures/test-webpush";

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
