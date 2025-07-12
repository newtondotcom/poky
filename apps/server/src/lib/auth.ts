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
              tokenUrl : process.env.CHURROS_TOKEN_URL || ""
          }, 
      ] 
  }) ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
});
