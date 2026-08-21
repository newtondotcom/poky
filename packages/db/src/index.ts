import { drizzle } from "drizzle-orm/bun-sql";
import { and, desc, eq, inArray, like, not, or } from "drizzle-orm";
import { env } from "@poky/env/server";
import { relations } from "./relations";

export const db = drizzle(env.DATABASE_URL, { relations });

export { relations };
export { and, desc, eq, inArray, like, not, or };
