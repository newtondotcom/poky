import { Redis } from "ioredis";
import logger from "@/lib/logger";

export class RedisService {
  private publisher: Redis | undefined;
  private subscriber: Redis | undefined;

  getPublisher() {
    if (!this.publisher) {
      this.publisher = new Redis(process.env.REDIS_URL as string);
      
      // Handle connection events
      this.publisher.on('error', (err) => {
        logger.error('Redis publisher error:', { error: err });
      });
      
      this.publisher.on('connect', () => {
        logger.info('Redis publisher connected');
      });
    }
    return this.publisher;
  }

  getSubscriber() {
    if (!this.subscriber) {
      this.subscriber = new Redis(process.env.REDIS_URL as string);
      
      // Handle connection events
      this.subscriber.on('error', (err) => {
        logger.error('Redis subscriber error:', { error: err });
      });
      
      this.subscriber.on('connect', () => {
        logger.info('Redis subscriber connected');
      });
    }
    return this.subscriber;
  }

  // Cleanup method to properly close connections
  async cleanup() {
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = undefined;
    }
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = undefined;
    }
  }
}

export const redisService = new RedisService();