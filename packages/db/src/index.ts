import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { env } from "@poky/env/server";

export const db = drizzle(env.DATABASE_URL);

export { eq };
