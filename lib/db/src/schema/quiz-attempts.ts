import { createInsertSchema } from "drizzle-zod";
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { childProfilesTable } from "./families";

// Answers are server-owned. Public quiz responses deliberately omit them.
export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").notNull().references(() => childProfilesTable.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 10 }).notNull(),
  targetId: text("target_id").notNull(),
  ageBand: varchar("age_band", { length: 10 }).notNull(),
  questions: jsonb("questions").notNull(),
  score: integer("score"),
  missedLessonIds: jsonb("missed_lesson_ids").notNull().default([]),
  reviewedLessonIds: jsonb("reviewed_lesson_ids").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (table) => [index("quiz_attempts_child_id_idx").on(table.childId)]);
export const insertQuizAttemptSchema = createInsertSchema(quizAttemptsTable).omit({ id: true, createdAt: true });
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
