import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  plugins: [
    genericOAuth({ 
      config: [ 
          { 
              providerId: "churros", 
              clientId: process.env.CHURROS_CLIENT_ID || "",
              clientSecret: process.env.CHURROS_CLIENT_SECRET || "",
              authorizationUrl : process.env.CHURROS_AUTHORIZATION_URL || "",
              tokenUrl : process.env.CHURROS_TOKEN_URL || "",
              scopes : ['openid', 'profile', 'preferred_username',"email","churros:profile"],
              async getUserInfo(tokens) {
                const userInfoUrl = process.env.CHURROS_USER_INFO;
                if (!userInfoUrl) {
                  throw new Error("CHURROS_USER_INFO environment variable is not set");
                }

                const response = await fetch(userInfoUrl, {
                  headers: {
                    "Authorization": `Bearer ${tokens.accessToken}`,
                    "Content-Type": "application/json",
                  },
                });

                if (!response.ok) {
                  throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
                }

                const userInfo = await response.json();

                return {
                  id: userInfo.sub || "", // could be uid but sub will be used for anonuymsation
                  name: userInfo.fullName ||"",
                  username: userInfo.uid || "",
                  image: userInfo.pictureURL || null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  email : userInfo.email,
                  emailVerified : userInfo.email_verified
                };
              },
          }, 
      ] 
  }) ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
});
