import { protectedProcedure } from "@/lib/trpc";
import { getUserPokesData } from "@/lib/get-user-pokes-data";
import { redisService } from "@/lib/redis";
import { addUserConnected, removeUserConnected } from "@/lib/user-connected";

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
    addUserConnected(currentUserId);

    const firstDatas = await getUserPokesData(currentUserId);
    yield firstDatas;

    try {
      // Subscribe to the channel
      await sub.subscribe(currentUserId);

      // Create async iterator to receive messages
      while (true) {
        const message = await new Promise<string>((resolve) => {
          sub.on("message", (ch: string, msg: string) => {
            if (ch === currentUserId) {
              resolve(msg);
            }
          });
        });
        const nextDatas = await getUserPokesData(currentUserId);
        yield nextDatas;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      throw error;
    } finally {
      console.log("Test subscription ended");
      await sub.unsubscribe(currentUserId);
      removeUserConnected(currentUserId);
    }
  },
);
