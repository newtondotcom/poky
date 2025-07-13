import { protectedProcedure } from "@/lib/trpc";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { pokes } from "@/db/schema/pok7";
import { eq, or, and } from "drizzle-orm";

export const pokeUserProcedure = protectedProcedure
  .input(
    z.object({
      targetUserId: z.string().min(1, "Target user ID is required"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const currentUserId = ctx.session.user.id;
    const { targetUserId } = input;

    // Prevent self-poking
    if (currentUserId === targetUserId) {
      throw new Error("You cannot poke yourself");
    }

    try {
      // Check if target user exists
      const targetUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, targetUserId))
        .limit(1);

      if (targetUser.length === 0) {
        throw new Error("Target user not found");
      }

      // Check if a poke relation already exists between these users
      const existingRelation = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeDate: pokes.lastPokeDate,
          lastPokeBy: pokes.lastPokeBy,
        })
        .from(pokes)
        .where(
          or(
            and(eq(pokes.userAId, currentUserId), eq(pokes.userBId, targetUserId)),
            and(eq(pokes.userAId, targetUserId), eq(pokes.userBId, currentUserId))
          )
        )
        .limit(1);

      if (existingRelation.length > 0) {
        // Update existing relation
        const relation = existingRelation[0];
        const newCount = relation.count + 1;
        const now = new Date();

        await db
          .update(pokes)
          .set({
            count: newCount,
            lastPokeDate: now,
            lastPokeBy: currentUserId,
          })
          .where(eq(pokes.id, relation.id));

        return {
          success: true,
          message: "Poke sent successfully",
          pokeRelation: {
            id: relation.id,
            count: newCount,
            lastPokeDate: now.toISOString(),
            lastPokeBy: currentUserId,
            isNewRelation: false,
          },
        };
      } else {
        // Create new relation
        const newRelationId = crypto.randomUUID();
        const now = new Date();

        await db.insert(pokes).values({
          id: newRelationId,
          userAId: currentUserId,
          userBId: targetUserId,
          count: 1,
          lastPokeDate: now,
          lastPokeBy: currentUserId,
          visibleLeaderboard: true, // Default to visible
        });

        return {
          success: true,
          message: "Poke sent successfully",
          pokeRelation: {
            id: newRelationId,
            count: 1,
            lastPokeDate: now.toISOString(),
            lastPokeBy: currentUserId,
            isNewRelation: true,
          },
        };
      }
    } catch (error) {
      console.error("Error poking user:", error);
      
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      
      throw new Error("Failed to poke user");
    }
  }); 