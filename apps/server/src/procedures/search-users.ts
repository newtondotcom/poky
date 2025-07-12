import { protectedProcedure } from "@/lib/trpc";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { like, or } from "drizzle-orm";

// Type for our simplified user response
export interface SearchUserResult {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  createdAt: string;
}

export const searchUsersProcedure = protectedProcedure
  .input(
    z.object({
      query: z.string().min(1, "Search query cannot be empty"),
    })
  )
  .query(async ({ input }) => {
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
          or(
            like(user.username, `%${query}%`),
            like(user.name, `%${query}%`),
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
      }));

      return {
        users: searchResults,
        count: searchResults.length,
      };

    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }); 