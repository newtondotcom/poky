import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

// defining the web push subscriptions
export const webpush = pgTable("webpush", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  expirationTime: timestamp("expiration_time", { withTimezone: false, mode: "date" }), // nullable
  options: text("options").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

// defining the poke concept : userA, userB, last_poke_by, count, date_last_poke, visible_leaderboard
export const pokes = pgTable("pokes", {
  id: text("id").primaryKey(),
  userAId: text("user_a_id").notNull().references(() => user.id),
  userBId: text("user_b_id").notNull().references(() => user.id),
  count: integer("count").notNull(),
  lastPokeDate: timestamp("last_poke_date", { withTimezone: false, mode: "date" }).notNull(),
  lastPokeBy: text("last_poke_by").notNull().references(() => user.id),
  visibleLeaderboard: boolean("visible_leaderboard").notNull(),
});