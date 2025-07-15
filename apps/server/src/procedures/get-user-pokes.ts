import { protectedProcedure } from "@/lib/trpc";
import { getUserPokesData } from "@/lib/get-user-pokes-data";

// Type for poke relation with user details
export interface UserPokeRelation {
  id: string;
  userAId: string;
  userBId: string;
  count: number;
  lastPokeDate: string;
  lastPokeBy: string;
  visibleLeaderboard: boolean;
  // User details for the other person in the relation
  otherUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

export const getUserPokesProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;
    try {
      return await getUserPokesData(currentUserId);
    } catch (error) {
      console.error("Error fetching user pokes:", error);
      throw new Error("Failed to fetch user pokes");
    }
  }); 