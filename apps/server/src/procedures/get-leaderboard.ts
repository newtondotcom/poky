import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { pokes } from "@/db/schema/pok7";
import { desc, eq, inArray } from "drizzle-orm";

// Type for leaderboard entry
export interface LeaderboardEntry {
  id: string;
  userAId: string;
  userBId: string;
  count: number;
  lastPokeDate: string;
  lastPokeBy: string;
  visibleLeaderboard: boolean;
  // User details for both users in the relation
  userA: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  userB: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

export const getLeaderboardProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    try {
      // Get top 50 poke relations ordered by count (highest first)
      const topPokeRelations = await db
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
        .where(eq(pokes.visibleLeaderboard, true))
        .orderBy(desc(pokes.count))
        .limit(50);

      if (topPokeRelations.length === 0) {
        return {
          entries: [],
          count: 0,
        };
      }

      // Get all unique user IDs from the poke relations
      const userIds = new Set<string>();
      topPokeRelations.forEach(relation => {
        userIds.add(relation.userAId);
        userIds.add(relation.userBId);
      });

      // Fetch user details for all users in the leaderboard
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
        })
        .from(user)
        .where(inArray(user.id, Array.from(userIds)));

      // Create a map for quick user lookup
      const userMap = new Map(users.map(u => [u.id, u]));

      // Combine poke relations with user details
      const leaderboardEntries: LeaderboardEntry[] = topPokeRelations.map((relation, index) => {
        const userA = userMap.get(relation.userAId);
        const userB = userMap.get(relation.userBId);

        if (!userA || !userB) {
          throw new Error(`User not found: ${relation.userAId} or ${relation.userBId}`);
        }

        return {
          id: relation.id,
          userAId: relation.userAId,
          userBId: relation.userBId,
          count: relation.count,
          lastPokeDate: relation.lastPokeDate.toISOString(),
          lastPokeBy: relation.lastPokeBy,
          visibleLeaderboard: relation.visibleLeaderboard,
          userA: {
            id: userA.id,
            name: userA.name,
            username: userA.username,
            image: userA.image,
          },
          userB: {
            id: userB.id,
            name: userB.name,
            username: userB.username,
            image: userB.image,
          },
        };
      });

      return {
        entries: leaderboardEntries,
        count: leaderboardEntries.length,
      };

    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw new Error("Failed to fetch leaderboard");
    }
  }); 