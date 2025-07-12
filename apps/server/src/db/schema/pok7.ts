import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "@/db/schema/auth";

// defining the web push suscriptions
export const webpush = sqliteTable("webpush", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  expirationTime: integer("expirationTime", { mode: "timestamp" }), // can be nullable
  options: text("options").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

// defining the poke concept : userA, userB, last_poke_by, count, date_last_poke, visible_leaderboard
export const pokes = sqliteTable("pokes", {
  id: text("id").primaryKey(),
  userAId: text("user_a_id").notNull().references(() => user.id),
  userBId: text("user_b_id").notNull().references(() => user.id),
  count: integer("count").notNull(),
  lastPokeDate: integer("last_poke_date", { mode: "timestamp" }).notNull(),
  lastPokeBy: text("last_poke_by").notNull().references(() => user.id),
  visibleLeaderboard: integer("visible_leaderboard", { mode: "boolean" }).notNull(),
});
