import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush, devices } from "@/db/schema/pok7";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const registerWebPushProcedure = protectedProcedure
  .input(z.object({
    endpoint: z.string(),
    expirationTime: z.number().nullable(),
    options: z.string(), // JSON stringified options
    id: z.string(), // subscription id (from client, usually endpoint hash or uuid)
    deviceId: z.string(),
    deviceName: z.string().optional(),
    userAgent: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    
    try {
      // First, ensure the device is registered
      const deviceData = {
        id: input.deviceId,
        userId,
        name: input.deviceName || "Unknown Device",
        userAgent: input.userAgent || "",
        lastSeen: new Date(),
      };

      // Upsert device
      await db.insert(devices).values(deviceData)
        .onConflictDoUpdate({
          target: devices.id,
          set: {
            lastSeen: new Date(),
            name: deviceData.name,
            userAgent: deviceData.userAgent,
          }
        });

      const expirationDate = input.expirationTime ? new Date(input.expirationTime) : null;
      
      // Check if subscription already exists for this device
      const existing = await db.select().from(webpush).where(
        eq(webpush.deviceId, input.deviceId)
      );
      
      if (existing.length > 0) {
        // Update existing subscription
        await db.update(webpush)
          .set({
            endpoint: input.endpoint,
            expirationTime: expirationDate,
            options: input.options,
            userId,
          })
          .where(eq(webpush.deviceId, input.deviceId));
      } else {
        // Insert new subscription
        await db.insert(webpush).values({
          id: input.id,
          endpoint: input.endpoint,
          expirationTime: expirationDate,
          options: input.options,
          userId,
          deviceId: input.deviceId,
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to register web push subscription", error);
      throw new Error("Failed to register web push subscription");
    }
  }); 