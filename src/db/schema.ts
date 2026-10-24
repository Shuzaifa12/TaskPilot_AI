import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  durationDays: integer("duration_days").notNull().default(2),
  dependencies: jsonb("dependencies").notNull().default([]),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvalsTable = pgTable("approvals", {
  id: text("id").primaryKey(),
  actionType: text("action_type").notNull(),
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  parameters: jsonb("parameters").notNull().default({}),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  step: text("step").notNull(),
  toolName: text("tool_name"),
  arguments: jsonb("arguments"),
  result: jsonb("result"),
  status: text("status").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
