import webpush from "web-push";
import logger from "./logger";
import { env } from "@poky/env/server";

webpush.setVapidDetails(`mailto:${env.VAPID_EMAIL}`, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  payload: unknown,
): Promise<void> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    logger.error("Web push error:", { error: err });
  }
}
