import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush } from "@/db/schema/pok7";
import { z } from "zod";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

export const getWebPushProcedure = protectedProcedure
  .input(z.object({
    id: z.string(), // subscription id (endpoint)
  }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    try {
      const result = await db.select().from(webpush).where(
        eq(webpush.id, input.id)
      );
      if (!result.length || result[0].userId !== userId) {
        return null;
      }
      return result[0];
    } catch (error) {
      logger.error("Failed to get web push subscription", { error });
      throw new Error("Failed to get web push subscription");
    }
  }); 