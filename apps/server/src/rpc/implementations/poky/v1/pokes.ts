import { db } from "@/db";
import { pokes, user } from "@/db/schema";
import { getUserPokesData } from "@/lib/get-user-pokes-data";
import logger from "@/lib/logger";
import { notifyTargetUser } from "@/lib/notify-target-user";
import { redisService } from "@/lib/redis";
import {
  addUserConnected,
  isUserConnected,
  removeUserConnected,
} from "@/lib/user-connected";
import { kUser } from "@/rpc/context";
import {
  SearchUserResultSchema,
  SearchUsersResponseSchema,
  type GetUserPokesRequest,
  type PokesService,
  type PokeUserRequest,
  type SearchUsersRequest,
} from "@/rpc/proto/poky/v1/pokes_service_pb";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import type { HandlerContext, ServiceImpl } from "@connectrpc/connect";
import { and, eq, like, not, or } from "drizzle-orm";

const sub = redisService.getSubscriber();
const pub = redisService.getPublisher();

async function decideWhichActionToPerform(targetUserId: string) {
  // if users logged as online in the map
  const targetUserConnected = await isUserConnected(targetUserId);
  logger.info(`Target user ${targetUserId} connected: ${targetUserConnected}`);

  if (targetUserConnected) {
    logger.info(`Publishing to target user channel: ${targetUserId}`);
    pub.publish(targetUserId, targetUserId);
  } else {
    logger.info(
      `Target user ${targetUserId} is offline, sending web push notification`,
    );
    notifyTargetUser(targetUserId);
  }
}

export class PokesServiceImpl implements ServiceImpl<typeof PokesService> {
  async *getUserPokes(req: GetUserPokesRequest, context: HandlerContext) {
    const currentUser = context.values.get(kUser);
    const currentUserId = currentUser.id;
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
  }

  async pokeUser(req: PokeUserRequest, context: HandlerContext) {
    const currentUser = context.values.get(kUser);
    const currentUserId = currentUser.id;
    const targetUserId = req.targetUserId;

    // Prevent self-poking
    if (currentUserId === targetUserId) {
      throw new Error("You cannot poke yourself");
    }

    try {
      // Check if target user exists
      const targetUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, targetUserId))
        .limit(1);

      if (targetUser.length === 0) {
        throw new Error("Target user not found");
      }

      // Check if a poke relation already exists between these users
      const [existingRelation] = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeDate: pokes.lastPokeDate,
          lastPokeBy: pokes.lastPokeBy,
        })
        .from(pokes)
        .where(
          or(
            and(
              eq(pokes.userAId, currentUserId),
              eq(pokes.userBId, targetUserId),
            ),
            and(
              eq(pokes.userAId, targetUserId),
              eq(pokes.userBId, currentUserId),
            ),
          ),
        )
        .limit(1);

      if (existingRelation) {
        // Update existing relation
        const newCount = existingRelation.count + 1;
        const now = new Date();

        await db
          .update(pokes)
          .set({
            count: newCount,
            lastPokeDate: now,
            lastPokeBy: currentUserId,
          })
          .where(eq(pokes.id, existingRelation.id));

        // Notify target user after database update
        decideWhichActionToPerform(targetUserId);

        // publish so that user ui is refreshed
        logger.info(`Publishing to Redis channel: ${currentUserId}`);
        pub.publish(currentUserId, currentUserId);

        return {
          success: true,
          message: "Poke sent successfully",
          pokeRelation: {
            id: existingRelation.id,
            count: newCount,
            lastPokeDate: timestampFromDate(now),
            lastPokeBy: currentUserId,
            isNewRelation: false,
          },
        };
      } else {
        // Create new relation
        const newRelationId = crypto.randomUUID();
        const now = new Date();

        await db.insert(pokes).values({
          id: newRelationId,
          userAId: currentUserId,
          userBId: targetUserId,
          count: 1,
          lastPokeDate: now,
          lastPokeBy: currentUserId,
          visibleLeaderboard: true, // Default to visible
        });

        // Notify target user after database update
        decideWhichActionToPerform(targetUserId);

        // publish so that user ui is refreshed
        logger.info(`Publishing to Redis channel: ${currentUserId}`);
        pub.publish(currentUserId, currentUserId);

        return {
          success: true,
          message: "Poke sent successfully",
          pokeRelation: {
            id: newRelationId,
            count: 1,
            lastPokeDate: timestampFromDate(now),
            lastPokeBy: currentUserId,
            isNewRelation: true,
          },
        };
      }
    } catch (error) {
      logger.error("Error poking user:", { error });

      if (error instanceof Error) {
        throw new Error(error.message);
      }

      throw new Error("Failed to poke user");
    }
  }

  async searchUsers(req: SearchUsersRequest, context: HandlerContext) {
    const currentUser = context.values.get(kUser);
    if (!currentUser) throw new Error("Unauthenticated");

    const query = req.query.trim();

    try {
      // 🔍 Search users
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(
          and(
            or(
              like(user.username, `%${query}%`),
              like(user.name, `%${query}%`),
            ),
            not(eq(user.id, currentUser.id)),
          ),
        )
        .limit(20);

      const currentUserId = currentUser.id;

      // ⚡ Fetch poke relations of the current user
      const pokeRelations = await db
        .select({
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeBy: pokes.lastPokeBy,
          lastPokeDate: pokes.lastPokeDate,
        })
        .from(pokes)
        .where(
          or(
            eq(pokes.userAId, currentUserId),
            eq(pokes.userBId, currentUserId),
          ),
        );

      // 🧠 Merge user info + poke info
      const searchResults = users.map((u) => {
        const relation = pokeRelations.find(
          (r) =>
            (r.userAId === currentUserId && r.userBId === u.id) ||
            (r.userAId === u.id && r.userBId === currentUserId),
        );

        return create(SearchUserResultSchema, {
          id: u.id,
          name: u.name ?? "",
          username: u.username ?? undefined, // 👈 use undefined not null
          image: u.image ?? undefined,
          createdAt: timestampFromDate(u.createdAt),
          hasPokeRelation: !!relation,
          pokeCount: relation?.count ?? 0,
          lastPokeBy: relation?.lastPokeBy ?? undefined,
          lastPokeDate: relation?.lastPokeDate
            ? timestampFromDate(relation.lastPokeDate)
            : undefined,
        });
      });

      return create(SearchUsersResponseSchema, {
        users: searchResults,
        count: searchResults.length,
      });
    } catch (error) {
      logger.error("Error searching users:", { error });
      throw new Error("Failed to search users");
    }
  }
}
