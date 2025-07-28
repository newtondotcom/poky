import { Redis } from "ioredis";

export class RedisService {
  private publisher: Redis | undefined;
  private subscriber: Redis | undefined;

  getPublisher() {
    if (!this.publisher) {
      this.publisher = new Redis(process.env.REDIS_URL as string);
      
      // Handle connection events
      this.publisher.on('error', (err) => {
        console.error('Redis publisher error:', err);
      });
      
      this.publisher.on('connect', () => {
        console.log('Redis publisher connected');
      });
    }
    return this.publisher;
  }

  getSubscriber() {
    if (!this.subscriber) {
      this.subscriber = new Redis(process.env.REDIS_URL as string);
      
      // Handle connection events
      this.subscriber.on('error', (err) => {
        console.error('Redis subscriber error:', err);
      });
      
      this.subscriber.on('connect', () => {
        console.log('Redis subscriber connected');
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