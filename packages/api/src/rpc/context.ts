import { createContextKey } from "@connectrpc/connect";

export const kUserId = createContextKey<string>("", {
  description: "Current user ID", // Description useful for debugging
});
