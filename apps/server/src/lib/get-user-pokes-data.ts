import { db } from "@/db";
import { pokes, user } from "@/db/schema";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { eq, or } from "drizzle-orm";
import logger from "./logger";

export interface UserPokeRelation {
  id: string;
  userAId: string;
  userBId: string;
  count: number;
  lastPokeDate: string;
  lastPokeBy: string;
  visibleLeaderboard: boolean;
  otherUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

export async function getUserPokesData(userId: string) {
  // Get all poke relations where the user is involved
  const pokeRelations = await db
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
    .where(or(eq(pokes.userAId, userId), eq(pokes.userBId, userId)));

  if (pokeRelations.length == 0) {
    return []
  }

  // Get user details for all the other users in poke relations
  const otherUserIds = pokeRelations.map((relation) =>
    relation.userAId === userId ? relation.userBId : relation.userAId,
  );

  const otherUsers = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(user)
    .where(or(...otherUserIds.map((id) => eq(user.id, id))));

  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  const pokeRelationsWithUsers: UserPokeRelation[] = pokeRelations.map(
    (relation) => {
      const otherUserId =
        relation.userAId === userId ? relation.userBId : relation.userAId;
      const otherUser = userMap.get(otherUserId);

      if (!otherUser) {
        throw new Error(`User not found: ${otherUserId}`);
      }

      return {
        id: relation.id,
        userAId: relation.userAId,
        userBId: relation.userBId,
        count: relation.count,
        lastPokeDate: relation.lastPokeDate.toISOString(),
        lastPokeBy: relation.lastPokeBy,
        visibleLeaderboard: relation.visibleLeaderboard,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
        },
      };
    },
  );

  pokeRelationsWithUsers.sort(
    (a, b) =>
      new Date(b.lastPokeDate).getTime() - new Date(a.lastPokeDate).getTime(),
  );

  logger.debug(pokeRelationsWithUsers.length)
  const pokeRelationMessage = pokeRelationsWithUsers.map((relation: any) => ({
    ...relation,
    lastPokeDate: timestampFromDate(new Date(relation.lastPokeDate)),
  }));

  return {
    pokeRelations: pokeRelationMessage,
    count: pokeRelationMessage.length,
    totalPokes: pokeRelationMessage.reduce(
      (sum: number, relation: any) => sum + relation.count,
      0,
    ),
  };
}
