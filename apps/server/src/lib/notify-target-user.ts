import { db } from "@/db";
import { webpush } from "@/db/schema/pok7";
import { eq } from "drizzle-orm";
import { sendWebPush } from "@/lib/webpush";
import { getUserPokesData } from "@/lib/get-user-pokes-data";

export async function notifyTargetUser(targetUserId: string) {
  if (wsSessionManager.isUserOnline(targetUserId)) {
    const pokeData = await getUserPokesData(targetUserId);
    wsSessionManager.sendToUser(targetUserId, {
      type: "poke_update",
      ...pokeData,
    });
    console.log("User is online");
  } else {
    const subs = await db
      .select()
      .from(webpush)
      .where(eq(webpush.userId, targetUserId));
    if (subs.length > 0) {
      const sub = subs[0];
      const subscription = {
        endpoint: sub.endpoint,
        expirationTime:
          sub.expirationTime instanceof Date
            ? sub.expirationTime.valueOf()
            : (sub.expirationTime ?? undefined),
        keys: JSON.parse(sub.options).keys,
      };
      await sendWebPush(subscription, {
        title: "You were poked!",
        body: "Open Pok7 to see who poked you.",
        icon: "/favicon-32x32.png",
        data: { type: "poke" },
      });
      console.log("webpush sent");
    }
    console.log("User is offline");
  }
}
