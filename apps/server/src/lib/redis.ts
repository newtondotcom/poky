import { Redis } from "ioredis";

export class RedisService {
  private publisher: Redis | undefined;
  private subscriber: Redis | undefined;

  getPublisher() {
    if (!this.publisher) {
      this.publisher = new Redis(process.env.REDIS_URL as string);
    }
    return this.publisher;
  }

  getSubscriber() {
    if (!this.subscriber) {
      this.subscriber = new Redis(process.env.REDIS_URL as string);
    }
    return this.subscriber;
  }
}

export const redisService = new RedisService();