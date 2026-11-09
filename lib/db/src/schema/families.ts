import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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

export const discountCodesTable = pgTable(
  "discount_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    label: varchar("label", { length: 100 }).notNull(),
    discountPercent: integer("discount_percent").notNull(),
    useLimit: integer("use_limit"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("discount_codes_active_idx").on(table.active)],
);

export const familyDiscountRedemptionsTable = pgTable(
  "family_discount_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codeId: uuid("code_id")
      .notNull()
      .references(() => discountCodesTable.id, { onDelete: "restrict" }),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardiansTable.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("family_discount_redemptions_guardian_id_unique").on(table.guardianId),
    uniqueIndex("family_discount_redemptions_code_guardian_unique").on(table.codeId, table.guardianId),
    index("family_discount_redemptions_code_id_idx").on(table.codeId),
  ],
);

export const childProfilesTable = pgTable(
  "child_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guardianId: text("guardian_id")
      .notNull()
      .references(() => guardiansTable.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 40 }).notNull(),
    ageBand: varchar("age_band", { length: 10 }),
    learningState: jsonb("learning_state").notNull().default({ weeklyGoal: 3, pledgeLevel: 0, projects: {} }),
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
    reflection: text("reflection"),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    quizScore: integer("quiz_score"),
    talkDiscussedAt: timestamp("talk_discussed_at", { withTimezone: true }),
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

/**
 * Server-owned active-learning time. One rolling 24-hour budget per learner;
 * only the current window is retained, and completed lesson history is untouched.
 */
export const childDailyLearningTable = pgTable(
  "child_daily_learning",
  {
    childId: uuid("child_id")
      .primaryKey()
      .references(() => childProfilesTable.id, { onDelete: "cascade" }),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    secondsUsed: integer("seconds_used").notNull().default(0),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(false),
    activeSessions: jsonb("active_sessions").$type<Record<string, string>>().notNull().default({}),
  },
);

export const insertChildProfileSchema = createInsertSchema(
  childProfilesTable,
).omit({ id: true, guardianId: true, createdAt: true });
export type InsertChildProfile = z.infer<typeof insertChildProfileSchema>;
export type Guardian = typeof guardiansTable.$inferSelect;
export type ChildProfile = typeof childProfilesTable.$inferSelect;
export type ChildProgress = typeof childProgressTable.$inferSelect;
export type ChildLevelMastery = typeof childLevelMasteryTable.$inferSelect;
