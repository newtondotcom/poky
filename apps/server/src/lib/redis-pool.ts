import Redis, { type Redis as RedisType } from "ioredis";
import logger from "@/lib/logger";

// -------------------
// Redis Connection Pool
// -------------------
class RedisConnectionPool {
  private static instance: RedisConnectionPool;
  private connections: Map<string, RedisType> = new Map();
  private maxConnections: number;
  private connectionCount: number = 0;

  private constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections;
  }

  public static getInstance(maxConnections?: number): RedisConnectionPool {
    if (!RedisConnectionPool.instance) {
      RedisConnectionPool.instance = new RedisConnectionPool(maxConnections);
    }
    return RedisConnectionPool.instance;
  }

  /**
   * Get or create a Redis connection for a specific user
   * Reuses existing connections when possible
   */
  public async getConnection(userId: string): Promise<RedisType> {
    // Check if we already have a connection for this user
    if (this.connections.has(userId)) {
      const connection = this.connections.get(userId)!;
      if (connection.status === "ready") {
        logger.debug(`Reusing Redis connection for user: ${userId}`);
        return connection;
      } else {
        // Connection is not ready, remove it and create a new one
        this.connections.delete(userId);
        this.connectionCount--;
      }
    }

    // Check if we've reached the connection limit
    if (this.connectionCount >= this.maxConnections) {
      // Find and remove an inactive connection
      await this.cleanupInactiveConnections();
      
      // If still at limit, wait for a connection to become available
      if (this.connectionCount >= this.maxConnections) {
        logger.warn(`Redis connection pool at capacity (${this.maxConnections}), waiting...`);
        await this.waitForAvailableConnection();
      }
    }

    // Create new connection
    const connection = await this.createConnection(userId);
    this.connections.set(userId, connection);
    this.connectionCount++;

    logger.debug(`Created new Redis connection for user: ${userId} (${this.connectionCount}/${this.maxConnections})`);
    return connection;
  }

  /**
   * Create a new Redis connection
   */
  private async createConnection(userId: string): Promise<RedisType> {
    const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    connection.on("error", (err: Error) => {
      logger.error(`Redis connection error for user ${userId}:`, err);
      this.removeConnection(userId);
    });

    connection.on("close", () => {
      logger.debug(`Redis connection closed for user: ${userId}`);
      this.removeConnection(userId);
    });

    await connection.connect();
    return connection;
  }

  /**
   * Remove a connection from the pool
   */
  private removeConnection(userId: string): void {
    if (this.connections.has(userId)) {
      const connection = this.connections.get(userId)!;
      connection.disconnect();
      this.connections.delete(userId);
      this.connectionCount--;
      logger.debug(`Removed Redis connection for user: ${userId} (${this.connectionCount}/${this.maxConnections})`);
    }
  }

  /**
   * Clean up inactive connections
   */
  private async cleanupInactiveConnections(): Promise<void> {
    const inactiveConnections: string[] = [];
    
    for (const [userId, connection] of this.connections.entries()) {
      if (connection.status !== "ready") {
        inactiveConnections.push(userId);
      }
    }

    for (const userId of inactiveConnections) {
      this.removeConnection(userId);
    }

    if (inactiveConnections.length > 0) {
      logger.debug(`Cleaned up ${inactiveConnections.length} inactive Redis connections`);
    }
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForAvailableConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.connectionCount < this.maxConnections) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    activeConnections: number;
    maxConnections: number;
    connectionUtilization: number;
    userIds: string[];
  } {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.maxConnections,
      connectionUtilization: (this.connectionCount / this.maxConnections) * 100,
      userIds: Array.from(this.connections.keys()),
    };
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  public async closeAll(): Promise<void> {
    logger.info("Closing all Redis connections...");
    
    const disconnectPromises = Array.from(this.connections.values()).map((connection) => {
      try {
        connection.disconnect();
      } catch (err) {
        logger.warn("Error disconnecting Redis connection:", err);
      }
    });

    await Promise.all(disconnectPromises);
    this.connections.clear();
    this.connectionCount = 0;
    
    logger.info("All Redis connections closed");
  }
}

// -------------------
// Export singleton instance
// -------------------
export const redisPool = RedisConnectionPool.getInstance(
  parseInt(process.env.REDIS_MAX_CONNECTIONS || "10")
);

// -------------------
// Helper function to get Redis connection for a user
// -------------------
export async function getRedisConnection(userId: string): Promise<RedisType> {
  return redisPool.getConnection(userId);
}
