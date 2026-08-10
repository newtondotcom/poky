import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    NATS_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    HOST: z.string().optional(),
    PORT: z.string().optional(),
    VAPID_EMAIL: z.email(),
    VAPID_PUBLIC_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
    CHURROS_CLIENT_ID: z.string().min(1),
    CHURROS_CLIENT_SECRET: z.string().min(1),
    CHURROS_AUTHORIZATION_URL: z.url(),
    CHURROS_TOKEN_URL: z.url(),
    CHURROS_USERINFO_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
