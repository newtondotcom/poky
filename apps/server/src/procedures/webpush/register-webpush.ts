import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush, devices } from "@/db/schema/pok7";
import { z } from "zod";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

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
      
      // Upsert web push subscription (one per device)
      await db.insert(webpush).values({
        id: input.id,
        endpoint: input.endpoint,
        expirationTime: expirationDate,
        options: input.options,
        userId,
        deviceId: input.deviceId,
      }).onConflictDoUpdate({
        target: webpush.deviceId, // Update based on deviceId constraint
        set: {
          endpoint: input.endpoint,
          expirationTime: expirationDate,
          options: input.options,
          userId,
          id: input.id, // Update the endpoint ID as well
        }
      });
      
      return { success: true };
    } catch (error) {
      logger.error("Failed to register web push subscription", { error });
      throw new Error("Failed to register web push subscription");
    }
  }); 