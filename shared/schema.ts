import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User schema for authentication (future use)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Room schema for event center rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("available"),
});

export const roomsRelations = relations(rooms, ({ many }) => ({
  assistanceRequests: many(assistanceRequests),
  activities: many(activities),
}));

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  location: true,
  status: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Assistance request schema
export const assistanceRequests = pgTable("assistance_requests", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  roomName: text("room_name").notNull(),
  roomLocation: text("room_location").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, in-progress, resolved
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
});

export const assistanceRequestsRelations = relations(assistanceRequests, ({ one }) => ({
  room: one(rooms, {
    fields: [assistanceRequests.roomId],
    references: [rooms.id],
  }),
}));

export const insertAssistanceRequestSchema = createInsertSchema(assistanceRequests).pick({
  roomId: true,
  roomName: true,
  roomLocation: true,
  status: true,
});

export type InsertAssistanceRequest = z.infer<typeof insertAssistanceRequestSchema>;
export type AssistanceRequest = typeof assistanceRequests.$inferSelect;

// Activity schema for logging
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'requested', 'responded', 'resolved'
  roomName: text("room_name").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  technician: text("technician"),
  roomId: integer("room_id").references(() => rooms.id),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  room: one(rooms, {
    fields: [activities.roomId],
    references: [rooms.id],
  }),
}));

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  roomName: true,
  message: true,
  technician: true,
  roomId: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// WebSocket message schemas
export const requestAssistanceSchema = z.object({
  type: z.literal("requestAssistance"),
  roomId: z.number(),
  roomName: z.string(),
  roomLocation: z.string(),
});

export const updateRequestStatusSchema = z.object({
  type: z.literal("updateRequestStatus"),
  requestId: z.number(),
  status: z.enum(["waiting", "in-progress", "resolved"]),
  updatedBy: z.string().optional(),
});

export const notificationSchema = z.object({
  type: z.literal("notification"),
  requestId: z.number(),
  roomName: z.string(),
  roomLocation: z.string(),
  status: z.enum(["waiting", "in-progress", "resolved"]),
  timestamp: z.number(),
});

export type RequestAssistanceMessage = z.infer<typeof requestAssistanceSchema>;
export type UpdateRequestStatusMessage = z.infer<typeof updateRequestStatusSchema>;
export type NotificationMessage = z.infer<typeof notificationSchema>;
