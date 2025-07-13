import { protectedProcedure } from "@/lib/trpc";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { pokes } from "@/db/schema/pok7";
import { like, or, eq, and, not } from "drizzle-orm";

// Type for our simplified user response
export interface SearchUserResult {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  createdAt: string;
  hasPokeRelation: boolean;
  pokeCount: number;
  lastPokeBy: string | null;
  lastPokeDate: string | null;
}

export const searchUsersProcedure = protectedProcedure
  .input(
    z.object({
      query: z.string().min(1, "Search query cannot be empty"),
    })
  )
  .query(async ({ input, ctx }) => {
    const { query } = input;

    try {
      // Search users in database by username, name, or email
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(
          and(
            or(
              like(user.username, `%${query}%`),
              like(user.name, `%${query}%`),
            ),
            // Exclude the current user from the results
            not(eq(user.id, ctx.session.user.id))
          )
        )
        .limit(20); // Limit results to 20 users

      // Transform the response to match our interface
      const searchResults: SearchUserResult[] = users.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        hasPokeRelation: false,
        pokeCount: 0,
        lastPokeBy: null,
        lastPokeDate: null,
      }));

      // Fetch if current poke relations exists and return result
      const currentUserId = ctx.session.user.id;
      
      // Get all poke relations for the current user
      const pokeRelations = await db
        .select({
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeBy: pokes.lastPokeBy,
          lastPokeDate: pokes.lastPokeDate
        })
        .from(pokes)
        .where(
          or(
            eq(pokes.userAId, currentUserId),
            eq(pokes.userBId, currentUserId)
          )
        );

      // Merge both results - add poke info to search results
      const searchResultsWithPokeRelations = searchResults.map(user => {
        const userPokeRelation = pokeRelations.find(relation => 
          (relation.userAId === currentUserId && relation.userBId === user.id) ||
          (relation.userAId === user.id && relation.userBId === currentUserId)
        );
        
        return {
          ...user,
          hasPokeRelation: !!userPokeRelation,
          pokeCount: userPokeRelation?.count || 0,
          lastPokeBy: userPokeRelation?.lastPokeBy || null,
          lastPokeDate: userPokeRelation?.lastPokeDate?.toISOString() || null
        };
      });

      console.log(searchResultsWithPokeRelations);
      return {
        users: searchResultsWithPokeRelations,
        count: searchResultsWithPokeRelations.length,
      };

    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }); 