import { createInsertSchema } from "drizzle-zod";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const guardiansTable = pgTable("guardians", {
  id: text("id").primaryKey(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const childProfilesTable = pgTable(
  "child_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardiansTable.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("child_profiles_guardian_id_idx").on(table.guardianId)],
);

export const childProgressTable = pgTable(
  "child_progress",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfilesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.childId, table.lessonId] }),
    index("child_progress_child_id_idx").on(table.childId),
  ],
);

export const childLevelMasteryTable = pgTable(
  "child_level_mastery",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfilesTable.id, { onDelete: "cascade" }),
    levelId: varchar("level_id", { length: 40 }).notNull(),
    score: integer("score").notNull(),
    graduatedAt: timestamp("graduated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.childId, table.levelId] }),
    index("child_level_mastery_child_id_idx").on(table.childId),
  ],
);

export const insertChildProfileSchema = createInsertSchema(
  childProfilesTable,
).omit({ id: true, guardianId: true, createdAt: true });
export type InsertChildProfile = z.infer<typeof insertChildProfileSchema>;
export type Guardian = typeof guardiansTable.$inferSelect;
export type ChildProfile = typeof childProfilesTable.$inferSelect;
export type ChildProgress = typeof childProgressTable.$inferSelect;
export type ChildLevelMastery = typeof childLevelMasteryTable.$inferSelect;
