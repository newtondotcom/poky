import { db } from "@/db";
import { pokes, user } from "@/db/schema";
import {
  generateFunnyFrenchName,
  generateFunnyPicture,
} from "@/lib/anonymization";
import logger from "@/lib/logger";
import { kUser } from "@/rpc/context";
import {
  GetUserAnonymizedDataResponseSchema,
  type GetLeaderboardRequest,
  type GetUserAnonymizedDataRequest,
  type LeaderboardService,
  type RefreshAnonymizedNameRequest,
  type RefreshAnonymizedPictureRequest,
  type TogglePokeVisibilityRequest,
} from "@/rpc/proto/poky/v1/leaderboard_service_pb";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import type { HandlerContext, ServiceImpl } from "@connectrpc/connect";
import { and, desc, eq, inArray, or } from "drizzle-orm";

export class LeaderboardServiceImpl
  implements ServiceImpl<typeof LeaderboardService>
{
  async getLeaderboard(req: GetLeaderboardRequest, context: HandlerContext) {
    const currentUser = context.values.get(kUser);

    try {
      // Get top 50 poke relations ordered by count (highest first)
      const topPokeRelations = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
          count: pokes.count,
          lastPokeDate: pokes.lastPokeDate,
          lastPokeBy: pokes.lastPokeBy,
          visibleLeaderboard: pokes.visibleLeaderboard,
        })
        .from(pokes)
        .orderBy(desc(pokes.count))
        .limit(50);

      if (topPokeRelations.length === 0) {
        return {
          entries: [],
          count: 0,
        };
      }

      // Get all unique user IDs from the poke relations
      const userIds = new Set<string>();
      topPokeRelations.forEach((relation) => {
        userIds.add(relation.userAId);
        userIds.add(relation.userBId);
      });

      // Fetch user details for all users in the leaderboard
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          usernameAnonymized: user.usernameAnonymized,
          pictureAnonymized: user.pictureAnonymized,
        })
        .from(user)
        .where(inArray(user.id, Array.from(userIds)));

      // Create a map for quick user lookup
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Combine poke relations with user details
      const leaderboardEntries = topPokeRelations.map((relation, _) => {
        const userA = userMap.get(relation.userAId);
        const userB = userMap.get(relation.userBId);

        if (!userA || !userB) {
          throw new Error(
            `User not found: ${relation.userAId} or ${relation.userBId}`,
          );
        }

        return {
          id: relation.id,
          userAId: relation.userAId,
          userBId: relation.userBId,
          count: relation.count,
          lastPokeDate: timestampFromDate(relation.lastPokeDate),
          lastPokeBy: relation.lastPokeBy,
          visibleLeaderboard: relation.visibleLeaderboard,
          userA: {
            id: userA.id,
            name: userA.name,
            username: userA.username,
            image: userA.image,
            usernameAnonymized: userA.usernameAnonymized ?? undefined,
            pictureAnonymized: userA.pictureAnonymized ?? undefined,
          },
          userB: {
            id: userB.id,
            name: userB.name,
            username: userB.username,
            image: userB.image,
            usernameAnonymized: userB.usernameAnonymized ?? undefined,
            pictureAnonymized: userB.pictureAnonymized ?? undefined,
          },
        };
      });
      return {
        entries: leaderboardEntries,
        count: leaderboardEntries.length,
      };
    } catch (error) {
      logger.error("Error fetching leaderboard:", { error });
      throw new Error("Failed to fetch leaderboard");
    }
  }

  async getUserAnonymizedData(
    req: GetUserAnonymizedDataRequest,
    context: HandlerContext,
  ) {
    const currentUser = context.values.get(kUser);
    try {
      const [userData] = await db
        .select({
          usernameAnonymized: user.usernameAnonymized,
          pictureAnonymized: user.pictureAnonymized,
        })
        .from(user)
        .where(eq(user.id, currentUser.id))
        .limit(1);

      if (!userData) {
        throw new Error("User not found");
      }

      const dataMessage = create(GetUserAnonymizedDataResponseSchema, {
        usernameAnonymized: userData.usernameAnonymized ?? "",
        pictureAnonymized: userData.pictureAnonymized ?? "",
      });
      return dataMessage;
    } catch (error) {
      logger.error("Error fetching user anonymized data:", { error });
      throw new Error("Failed to fetch user anonymized data");
    }
  }

  async togglePokeVisibility(
    req: TogglePokeVisibilityRequest,
    context: HandlerContext,
  ) {
    const currentUser = context.values.get(kUser);
    const currentUserId = currentUser.id;
    const { relationId, visible } = req;

    try {
      // Verify the user owns this poke relation
      const existingRelation = await db
        .select({
          id: pokes.id,
          userAId: pokes.userAId,
          userBId: pokes.userBId,
        })
        .from(pokes)
        .where(
          and(
            eq(pokes.id, relationId),
            or(
              eq(pokes.userAId, currentUserId),
              eq(pokes.userBId, currentUserId),
            ),
          ),
        )
        .limit(1);

      if (existingRelation.length === 0) {
        throw new Error(
          "Poke relation not found or you don't have permission to modify it",
        );
      }

      // Update the visibility
      await db
        .update(pokes)
        .set({
          visibleLeaderboard: visible,
        })
        .where(eq(pokes.id, relationId));

      return {
        success: true,
        message: `Poke relation ${visible ? "made visible" : "hidden"} on leaderboard`,
      };
    } catch (error) {
      console.error("Error toggling poke visibility:", error);
      throw new Error("Failed to update poke visibility");
    }
  }

  async refreshAnonymizedPicture(
    req: RefreshAnonymizedPictureRequest,
    context: HandlerContext,
  ) {
    try {
      const currentUser = context.values.get(kUser);
      const userId = currentUser.id;
      const newPicture = generateFunnyPicture();

      await db
        .update(user)
        .set({
          pictureAnonymized: newPicture,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      return { pictureAnonymized: newPicture };
    } catch (error) {
      logger.error("Error refreshing anonymized picture:", { error });
      throw new Error("Failed to refresh anonymized picture");
    }
  }

  async refreshAnonymizedName(
    req: RefreshAnonymizedNameRequest,
    context: HandlerContext,
  ) {
    try {
      const currentUser = context.values.get(kUser);
      const userId = currentUser.id;
      const newName = generateFunnyFrenchName();

      await db
        .update(user)
        .set({
          usernameAnonymized: newName,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      return {
        usernameAnonymized: newName,
      };
    } catch (error) {
      logger.error("Error refreshing anonymized name:", { error });
      throw new Error("Failed to refresh anonymized name");
    }
  }
}
