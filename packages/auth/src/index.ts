import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@poky/db";
import * as schema from "@poky/db/schema/auth";
import { genericOAuth } from "better-auth/plugins";
import { eq } from "@poky/db";
import { generateUserAnonymizedData } from "@poky/db/utils/anonymization";
import { user } from "@poky/db/schema/auth";
import { expo } from "@better-auth/expo";
import { env } from "@poky/env/server";
import { z } from "zod";

const churrosUserInfoSchema = z.object({
  sub: z.string().optional(),
  fullName: z.string().optional(),
  uid: z.string().optional(),
  nickname: z.string().optional(),
  pictureURL: z.string().optional(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  user: {
    additionalFields: {
      usernameAnonymized: {
        type: "string",
        required: true,
        defaultValue: "",
        input: false,
      },
      imageAnonymized: {
        type: "string",
        required: true,
        defaultValue: "",
        input: false,
      },
      username: {
        type: "string",
        required: true,
        defaultValue: "",
        input: false,
      },
    },
  },
  plugins: [
    expo(),
    genericOAuth({
      config: [
        {
          providerId: "churros",
          clientId: env.CHURROS_CLIENT_ID || "",
          clientSecret: env.CHURROS_CLIENT_SECRET || "",
          authorizationUrl: env.CHURROS_AUTHORIZATION_URL || "",
          tokenUrl: env.CHURROS_TOKEN_URL || "",
          scopes: ["openid", "profile", "preferred_username", "email", "churros:profile"],
          async getUserInfo(tokens) {
            const userInfoUrl = env.CHURROS_USERINFO_URL;

            const response = await fetch(userInfoUrl, {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(
                `Failed to fetch user info: ${response.status} ${response.statusText}`,
              );
            }

            const userInfo = churrosUserInfoSchema.parse(await response.json());

            console.log("User info received", { userInfo });

            const userId = userInfo.sub || "";

            // Check if user already exists and has anonymized data
            const [existingUser] = await db
              .select({
                usernameAnonymized: user.usernameAnonymized,
                imageAnonymized: user.imageAnonymized,
              })
              .from(user)
              .where(eq(user.id, userId))
              .limit(1);

            let anonymizedData: {
              usernameAnonymized: string | null;
              imageAnonymized: string | null;
            };

            // Only generate new anonymized data if user doesn't exist
            if (!existingUser) {
              anonymizedData = generateUserAnonymizedData(userId);
            } else {
              // Use existing anonymized data
              anonymizedData = {
                usernameAnonymized: existingUser.usernameAnonymized,
                imageAnonymized: existingUser.imageAnonymized,
              };
            }

            // Extra keys beyond OAuth2UserInfo are persisted via user.additionalFields.
            return {
              id: userId,
              name: userInfo.fullName || "",
              email: userInfo.email || "",
              image: userInfo.pictureURL,
              emailVerified: userInfo.email_verified ?? false,
              username: userInfo.uid || userInfo.nickname || "",
              usernameAnonymized: anonymizedData.usernameAnonymized ?? "",
              imageAnonymized: anonymizedData.imageAnonymized ?? "",
            } as import("better-auth").OAuth2UserInfo;
          },
        },
      ],
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN?.split(",") || [],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
});
