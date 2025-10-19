import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { generateFunnyFrenchName, generateFunnyPicture } from "@/lib/anonymization";
import logger from "@/lib/logger";

export const getUserAnonymizedDataProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    try {
      const userData = await db
        .select({
          usernameAnonymized: user.usernameAnonymized,
          pictureAnonymized: user.pictureAnonymized,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (userData.length === 0) {
        throw new Error("User not found");
      }

      return userData[0];
    } catch (error) {
      logger.error("Error fetching user anonymized data:", { error });
      throw new Error("Failed to fetch user anonymized data");
    }
  });

export const refreshAnonymizedNameProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;
      const newName = generateFunnyFrenchName();
      
      await db
        .update(user)
        .set({
          usernameAnonymized: newName,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
      
      return { usernameAnonymized: newName };
    } catch (error) {
      logger.error("Error refreshing anonymized name:", { error });
      throw new Error("Failed to refresh anonymized name");
    }
  });

export const refreshAnonymizedPictureProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;
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
  }); 