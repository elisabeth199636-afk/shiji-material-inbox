import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  name: text("name").primaryKey(),
  color: text("color").notNull().default("cyan"),
  position: integer("position").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull(),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  normalizedUrl: text("normalized_url").notNull().unique(),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  author: text("author"),
  thumbnail: text("thumbnail"),
  category: text("category").notNull().default("收件箱"),
  tags: text("tags").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  captureMethod: text("capture_method").notNull().default("网页粘贴"),
  device: text("device").notNull().default("网页"),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("ready"),
  previewCheckedAt: text("preview_checked_at"),
  createdAt: text("created_at").notNull(),
});

export type CategoryRecord = typeof categories.$inferSelect;
export type ItemRecord = typeof items.$inferSelect;
