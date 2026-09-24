import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const LEGACY_USER_ID = "__legacy_owner__";

export const categories = sqliteTable(
  "categories",
  {
    userId: text("user_id").notNull().default(LEGACY_USER_ID),
    name: text("name").notNull(),
    color: text("color").notNull().default("cyan"),
    position: integer("position").notNull().default(0),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.name] }),
    index("categories_user_position_idx").on(table.userId, table.position),
  ],
);

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(LEGACY_USER_ID),
    url: text("url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
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
  },
  (table) => [
    uniqueIndex("items_user_normalized_url_unique").on(
      table.userId,
      table.normalizedUrl,
    ),
    index("items_user_created_at_idx").on(table.userId, table.createdAt),
    index("items_user_category_idx").on(table.userId, table.category),
  ],
);

export type CategoryRecord = typeof categories.$inferSelect;
export type ItemRecord = typeof items.$inferSelect;
