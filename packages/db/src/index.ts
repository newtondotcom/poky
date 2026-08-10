import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, inArray, like, not, or } from "drizzle-orm";
import { env } from "@poky/env/server";

export const db = drizzle(env.DATABASE_URL);

export { and, desc, eq, inArray, like, not, or };
