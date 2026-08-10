import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or, inArray, and, not, like, desc, asc, count, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { env } from "@poky/env/server";

export const db = drizzle(env.DATABASE_URL);
