import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { webpush } from "@/db/schema/pok7";
import { eq } from "drizzle-orm";
import { sendWebPush } from "@/lib/webpush";

export const testWebPushProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
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
  }); 