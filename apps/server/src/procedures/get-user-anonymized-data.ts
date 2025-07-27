import { protectedProcedure } from "@/lib/trpc";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

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
      console.error("Error fetching user anonymized data:", error);
      throw new Error("Failed to fetch user anonymized data");
    }
  }); 