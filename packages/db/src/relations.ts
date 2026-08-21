import { defineRelations } from "drizzle-orm";
import * as auth from "./schema/auth";
import * as poky from "./schema/poky";

export const relations = defineRelations({ ...auth, ...poky }, (r) => ({
  devices: {
    user: r.one.user({
      from: r.devices.userId,
      to: r.user.id,
      optional: false,
    }),
    webPushSubscriptions: r.many.webpush({
      from: r.devices.id,
      to: r.webpush.deviceId,
    }),
  },
  webpush: {
    device: r.one.devices({
      from: r.webpush.deviceId,
      to: r.devices.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.webpush.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));
