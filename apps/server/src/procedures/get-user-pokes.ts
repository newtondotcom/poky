import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { pokes } from "@/db/schema/pok7";
import { eq, or } from "drizzle-orm";

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
      // Get all poke relations where the current user is involved
      const pokeRelations = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeDate: pokes.lastPokeDate,
          lastPokeBy: pokes.lastPokeBy,
          visibleLeaderboard: pokes.visibleLeaderboard,
        })
        .from(pokes)
        .where(
          or(
            eq(pokes.userAId, currentUserId),
            eq(pokes.userBId, currentUserId)
          )
        );

      // Get user details for all the other users in poke relations
      const otherUserIds = pokeRelations.map(relation => 
        relation.userAId === currentUserId ? relation.userBId : relation.userAId
      );

      const otherUsers = await db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        })
        .from(user)
        .where(
          or(...otherUserIds.map(id => eq(user.id, id)))
        );

      // Create a map for quick user lookup
      const userMap = new Map(otherUsers.map(u => [u.id, u]));

      // Combine poke relations with user details
      const pokeRelationsWithUsers: UserPokeRelation[] = pokeRelations.map(relation => {
        const otherUserId = relation.userAId === currentUserId ? relation.userBId : relation.userAId;
        const otherUser = userMap.get(otherUserId);

        if (!otherUser) {
          throw new Error(`User not found: ${otherUserId}`);
        }

        return {
          id: relation.id,
          userAId: relation.userAId,
          userBId: relation.userBId,
          count: relation.count,
          lastPokeDate: relation.lastPokeDate.toISOString(),
          lastPokeBy: relation.lastPokeBy,
          visibleLeaderboard: relation.visibleLeaderboard,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            image: otherUser.image,
          },
        };
      });

      // Sort by last poke date (most recent first)
      pokeRelationsWithUsers.sort((a, b) => 
        new Date(b.lastPokeDate).getTime() - new Date(a.lastPokeDate).getTime()
      );

      return {
        pokeRelations: pokeRelationsWithUsers,
        count: pokeRelationsWithUsers.length,
        totalPokes: pokeRelationsWithUsers.reduce((sum, relation) => sum + relation.count, 0),
      };

    } catch (error) {
      console.error("Error fetching user pokes:", error);
      throw new Error("Failed to fetch user pokes");
    }
  }); 