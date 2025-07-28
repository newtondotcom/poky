import { protectedProcedure } from "@/lib/trpc";
import { getUserPokesData } from "@/lib/get-user-pokes-data";
import { redisService } from "@/lib/redis";
import { addUserConnected, removeUserConnected } from "@/lib/user-connected";
import logger from "@/lib/logger";

// Type for poke relation with user details
export interface UserPokeRelation {
  id: string;
  userAId: string;
  userBId: string;
  count: number;
  lastPokeDate: string;
  lastPokeBy: string;
  visibleLeaderboard: boolean;
  // User details for the other person in the relation
  otherUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

const sub = redisService.getSubscriber();

export const getUserPokesProcedure = protectedProcedure.subscription(
  async function* (opts) {
    const currentUserId = opts.ctx.session.user.id;
    logger.info(`Starting subscription for user: ${currentUserId}`);
    addUserConnected(currentUserId);

    const firstDatas = await getUserPokesData(currentUserId);
    yield firstDatas;

    try {
      // Subscribe to the channel
      await sub.subscribe(currentUserId);
      logger.info(`Subscribed to Redis channel: ${currentUserId}`);

      // Create async iterator to receive messages
      while (true) {
        logger.info(`Waiting for message on channel: ${currentUserId}`);
        await new Promise<string>((resolve, reject) => {
          // Create a one-time message handler
          const messageHandler = (ch: string, msg: string) => {
            if (ch === currentUserId) {
              logger.info(`Received message on channel ${ch}: ${msg}`);
              // Remove the listener to prevent memory leaks
              sub.off("message", messageHandler);
              clearTimeout(timeout);
              resolve(msg);
            }
          };

          // Add the listener
          sub.on("message", messageHandler);

          // Set a timeout to prevent hanging
          const timeout = setTimeout(() => {
            logger.info(`Subscription timeout for user: ${currentUserId}`);
            sub.off("message", messageHandler);
            reject(new Error("Subscription timeout"));
          }, 30000); // 30 second timeout
        });
        
        logger.info(`Processing update for user: ${currentUserId}`);
        const nextDatas = await getUserPokesData(currentUserId);
        yield nextDatas;
      }
    } catch (error) {
      logger.error("Subscription error:", { error });
      throw error;
    } finally {
      logger.info("Subscription ended for user:", currentUserId);
      await sub.unsubscribe(currentUserId);
      removeUserConnected(currentUserId);
    }
  },
);
