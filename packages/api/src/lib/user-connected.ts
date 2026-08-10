import { natsService } from "./nats";

/**
 * Presence tracking backed by the NATS JetStream KV bucket "presence".
 * The bucket has a max age (see NatsService), so keys expire automatically;
 * re-putting a key writes a new revision and resets its age.
 */

/**
 * Mark user as connected. Call this when user connects or shows activity.
 */
export async function addUserConnected(userId: string): Promise<void> {
  const kv = await natsService.getPresenceKv();
  await kv.put(userId, "1");
}

/**
 * Remove user from connected list.
 */
export async function removeUserConnected(userId: string): Promise<void> {
  const kv = await natsService.getPresenceKv();
  await kv.purge(userId);
}

/**
 * Check if user is currently connected.
 */
export async function isUserConnected(userId: string): Promise<boolean> {
  const kv = await natsService.getPresenceKv();
  const entry = await kv.get(userId);
  return entry !== null && entry.operation === "PUT";
}

/**
 * Refresh user connection (call on user activity).
 */
export const refreshUserConnection = addUserConnected;

/**
 * Get all currently connected users.
 */
export async function getConnectedUsers(): Promise<string[]> {
  const kv = await natsService.getPresenceKv();
  const users: string[] = [];
  for await (const key of await kv.keys()) {
    users.push(key);
  }
  return users;
}

/**
 * Get count of connected users.
 */
export async function getConnectedUsersCount(): Promise<number> {
  const users = await getConnectedUsers();
  return users.length;
}

/**
 * Clear all connections.
 */
export async function clearAllConnections(): Promise<void> {
  const kv = await natsService.getPresenceKv();
  for (const userId of await getConnectedUsers()) {
    await kv.purge(userId);
  }
}
