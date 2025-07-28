import Redis from "ioredis";
import logger from "@/lib/logger";

class UserConnectionManager {
  private static instance: UserConnectionManager;
  private redis: Redis;
  private readonly CONNECTED_USERS_SET = "connected_users";
  private readonly USER_TTL_PREFIX = "user_ttl:";
  private readonly DEFAULT_TTL = 300; // 5 minutes

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL as string);

    // Start cleanup interval
    this.startCleanupInterval();
  }

  public static getInstance(): UserConnectionManager {
    if (!UserConnectionManager.instance) {
      UserConnectionManager.instance = new UserConnectionManager();
    }
    return UserConnectionManager.instance;
  }

  /**
   * Add user as connected with automatic expiration
   * Call this when user connects or shows activity
   */
  public async addUserConnected(
    userId: string,
    ttlSeconds: number = this.DEFAULT_TTL,
  ): Promise<void> {
    // Set TTL key for automatic cleanup
    await this.redis.setex(`${this.USER_TTL_PREFIX}${userId}`, ttlSeconds, "1");

    // Add to set for fast lookups
    await this.redis.sadd(this.CONNECTED_USERS_SET, userId);
  }

  /**
   * Remove user from connected list
   */
  public async removeUserConnected(userId: string): Promise<void> {
    await this.redis.del(`${this.USER_TTL_PREFIX}${userId}`);
    await this.redis.srem(this.CONNECTED_USERS_SET, userId);
  }

  /**
   * Check if user is connected (checks TTL key)
   */
  public async isUserConnected(userId: string): Promise<boolean> {
    const result = await this.redis.get(`${this.USER_TTL_PREFIX}${userId}`);
    return result !== null;
  }

  /**
   * Refresh user connection (call on user activity)
   * This is key for keeping active users connected
   */
  public async refreshUserConnection(
    userId: string,
    ttlSeconds: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const exists = await this.redis.get(`${this.USER_TTL_PREFIX}${userId}`);
    if (exists) {
      await this.redis.expire(`${this.USER_TTL_PREFIX}${userId}`, ttlSeconds);
    } else {
      // User wasn't connected, add them
      await this.addUserConnected(userId, ttlSeconds);
    }
  }

  /**
   * Get all currently connected users
   */
  public async getConnectedUsers(): Promise<string[]> {
    // Clean up first to ensure accuracy
    await this.cleanupExpiredConnections();
    return await this.redis.smembers(this.CONNECTED_USERS_SET);
  }

  /**
   * Get count of connected users
   */
  public async getConnectedUsersCount(): Promise<number> {
    await this.cleanupExpiredConnections();
    return await this.redis.scard(this.CONNECTED_USERS_SET);
  }

  /**
   * Clear all connections
   */
  public async clearAllConnections(): Promise<void> {
    // Get all users first
    const users = await this.redis.smembers(this.CONNECTED_USERS_SET);

    // Delete TTL keys
    if (users.length > 0) {
      const ttlKeys = users.map((userId) => `${this.USER_TTL_PREFIX}${userId}`);
      await this.redis.del(...ttlKeys);
    }

    // Clear the set
    await this.redis.del(this.CONNECTED_USERS_SET);
  }

  /**
   * Clean up expired connections from the set
   * This runs automatically but can be called manually
   */
  public async cleanupExpiredConnections(): Promise<number> {
    const connectedUsers = await this.redis.smembers(this.CONNECTED_USERS_SET);
    let cleanedCount = 0;

    for (const userId of connectedUsers) {
      const isActive = await this.redis.get(`${this.USER_TTL_PREFIX}${userId}`);
      if (!isActive) {
        await this.redis.srem(this.CONNECTED_USERS_SET, userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every 2 minutes
    setInterval(async () => {
      try {
        await this.cleanupExpiredConnections();
      } catch (error) {
        logger.error("Cleanup interval error:", { error });
      }
    }, 120000); // 2 minutes
  }

  /**
   * Get user's remaining TTL in seconds
   */
  public async getUserTTL(userId: string): Promise<number> {
    return await this.redis.ttl(`${this.USER_TTL_PREFIX}${userId}`);
  }

  /**
   * Batch operations for better performance
   */
  public async addMultipleUsers(
    userIds: string[],
    ttlSeconds: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    userIds.forEach((userId) => {
      pipeline.setex(`${this.USER_TTL_PREFIX}${userId}`, ttlSeconds, "1");
      pipeline.sadd(this.CONNECTED_USERS_SET, userId);
    });

    await pipeline.exec();
  }
}

// Export singleton instance
export const userConnectionManager = UserConnectionManager.getInstance();

// Export convenience functions with the same API as your original code
export const addUserConnected = (userId: string, ttlSeconds?: number) =>
  userConnectionManager.addUserConnected(userId, ttlSeconds);

export const removeUserConnected = (userId: string) =>
  userConnectionManager.removeUserConnected(userId);

export const isUserConnected = (userId: string) =>
  userConnectionManager.isUserConnected(userId);

export const getConnectedUsers = () =>
  userConnectionManager.getConnectedUsers();

export const getConnectedUsersCount = () =>
  userConnectionManager.getConnectedUsersCount();

export const clearAllConnections = () =>
  userConnectionManager.clearAllConnections();

// Additional useful functions
export const refreshUserConnection = (userId: string, ttlSeconds?: number) =>
  userConnectionManager.refreshUserConnection(userId, ttlSeconds);

export const getUserTTL = (userId: string) =>
  userConnectionManager.getUserTTL(userId);
