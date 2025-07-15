import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush } from "@/db/schema/pok7";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const deleteWebPushProcedure = protectedProcedure
  .input(z.object({
    id: z.string(), // subscription id (endpoint)
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    // assert user Id is the same as webpush user_id
    try {
      // First, check if the subscription exists and belongs to the user
      const existing = await db.select().from(webpush).where(
        eq(webpush.id, input.id)
      );
      if (!existing.length || existing[0].userId !== userId) {
        throw new Error("Subscription not found or not owned by user");
      }
      // Then, delete it
      await db.delete(webpush).where(
        eq(webpush.id, input.id)
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to delete web push subscription", error);
      throw new Error("Failed to delete web push subscription");
    }
  }); 