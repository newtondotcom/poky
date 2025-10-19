import { protectedProcedure } from "@/lib/trpc";
import { z } from "zod";
import { db } from "@/db";
import { pokes } from "@/db/schema/pok7";
import { eq, or, and } from "drizzle-orm";

export const togglePokeVisibilityProcedure = protectedProcedure
  .input(
    z.object({
      relationId: z.string().min(1, "Relation ID is required"),
      visible: z.boolean(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const currentUserId = ctx.session.user.id;
    const { relationId, visible } = input;

    try {
      // Verify the user owns this poke relation
      const existingRelation = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
        })
        .from(pokes)
        .where(
          and(
            eq(pokes.id, relationId),
            or(
              eq(pokes.userAId, currentUserId),
              eq(pokes.userBId, currentUserId)
            )
          )
        )
        .limit(1);

      if (existingRelation.length === 0) {
        throw new Error("Poke relation not found or you don't have permission to modify it");
      }

      // Update the visibility
      await db
        .update(pokes)
        .set({
          visibleLeaderboard: visible,
        })
        .where(eq(pokes.id, relationId));

      return {
        success: true,
        message: `Poke relation ${visible ? "made visible" : "hidden"} on leaderboard`,
      };
    } catch (error) {
      console.error("Error toggling poke visibility:", error);
      throw new Error("Failed to update poke visibility");
    }
  }); 