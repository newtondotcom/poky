import { db } from "@/db";
import { devices, webpush } from "@/db/schema";
import logger from "@/lib/logger";
import { sendWebPush } from "@/lib/webpush";
import { kUser } from "@/rpc/context";
import type { DeleteWebPushRequest, GetWebPushRequest, RegisterWebPushRequest, TestWebPushRequest, WebPushService } from "@/rpc/proto/poky/v1/webpush_service_pb";
import type { HandlerContext, ServiceImpl } from "@connectrpc/connect";
import { eq } from "drizzle-orm";

export class WebpushServiceImpl implements ServiceImpl<typeof WebPushService> {
  async RegisterWebPush(req : RegisterWebPushRequest, context: HandlerContext){
    const currentUser = context.values.get(kUser);
    const userId = currentUser.id;
    try {
      // First, ensure the device is registered
      const deviceData = {
        id: req.deviceId,
        userId,
        name: req.deviceName || "Unknown Device",
        userAgent: req.userAgent || "",
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

      const expirationDate = req.expirationTime ? new Date(req.expirationTime.toString()) : null;

      // Upsert web push subscription (one per device)
      await db.insert(webpush).values({
        id: req.id,
        endpoint: req.endpoint,
        expirationTime: expirationDate,
        options: req.options,
        userId,
        deviceId: req.deviceId,
      }).onConflictDoUpdate({
        target: webpush.deviceId, // Update based on deviceId constraint
        set: {
          endpoint: req.endpoint,
          expirationTime: expirationDate,
          options: req.options,
          userId,
          id: req.id, // Update the endpoint ID as well
        }
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to register web push subscription", { error });
      throw new Error("Failed to register web push subscription");
    }
  }

  async GetWebPush(req: GetWebPushRequest, context: HandlerContext) {
    const currentUser = context.values.get(kUser);
    const userId = currentUser.id;
    try {
      const [result] = await db.select().from(webpush).where(
        eq(webpush.id, req.id)
      );
      if (!result || result.userId !== userId) {
        return null;
      }
      return result;
    } catch (error) {
      logger.error("Failed to get web push subscription", { error });
      throw new Error("Failed to get web push subscription");
    }
  }

  async DeleteWebPush(req: DeleteWebPushRequest, context: HandlerContext){
    const currentUser = context.values.get(kUser);
    const userId = currentUser.id;
    // assert user Id is the same as webpush user_id
    try {
      // First, check if the subscription exists and belongs to the user
      const [existing] = await db.select().from(webpush).where(
        eq(webpush.id, req.id)
      );
      if (!existing || existing.userId !== userId) {
        throw new Error("Subscription not found or not owned by user");
      }
      // Then, delete it
      await db.delete(webpush).where(
        eq(webpush.id, req.id)
      );
      return { success: true };
    } catch (error) {
      logger.error("Failed to delete web push subscription", { error });
      throw new Error("Failed to delete web push subscription");
    }
  }

  async TestWebPush(req: TestWebPushRequest, context: HandlerContext){
    const currentUser = context.values.get(kUser);
    const userId = currentUser.id;
    try {
      // Get user's web push subscriptions
      const subscriptions = await db
        .select()
        .from(webpush)
        .where(eq(webpush.userId, userId));

      if (subscriptions.length === 0) {
        throw new Error("No web push subscriptions found for user");
      }

      // Send test notification to all user's devices
      const promises = subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          expirationTime:
            sub.expirationTime instanceof Date
              ? sub.expirationTime.valueOf()
              : (sub.expirationTime ?? undefined),
          keys: JSON.parse(sub.options).keys,
        };

        await sendWebPush(subscription, {
          title: "Test Notification",
          body: "This is a test notification from Pok7!",
          icon: "/favicon-32x32.png",
          data: { type: "test" },
        });
      });

      await Promise.all(promises);

      return { success: true, sentTo: subscriptions.length };
    } catch (error) {
      console.error("Failed to send test web push notification", error);
      throw new Error("Failed to send test notification");
    }
  }
}
