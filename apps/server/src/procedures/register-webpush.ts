import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush } from "@/db/schema/pok7";
import { z } from "zod";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

export const registerWebPushProcedure = protectedProcedure
  .input(z.object({
    endpoint: z.string(),
    expirationTime: z.number().nullable(),
    options: z.string(), // JSON stringified options
    id: z.string(), // subscription id (from client, usually endpoint hash or uuid)
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    // Upsert: if a subscription with this id exists for this user, update it; otherwise, insert new
    try {
      const expirationDate = input.expirationTime ? new Date(input.expirationTime) : null;
      const existing = await db.select().from(webpush).where(
        eq(webpush.id, input.id)
      );
      if (existing.length > 0) {
        await db.update(webpush)
          .set({
            endpoint: input.endpoint,
            expirationTime: expirationDate,
            options: input.options,
            userId,
          })
          .where(eq(webpush.id, input.id));
      } else {
        await db.insert(webpush).values({
          id: input.id,
          endpoint: input.endpoint,
          expirationTime: expirationDate,
          options: input.options,
          userId,
        });
      }
      return { success: true };
    } catch (error) {
      logger.error("Failed to register web push subscription", { error });
      throw new Error("Failed to register web push subscription");
    }
  }); 