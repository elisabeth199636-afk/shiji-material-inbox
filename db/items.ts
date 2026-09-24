import { env } from "cloudflare:workers";
import { extractHttpUrl } from "../lib/link-input";
import { fetchLinkPreview, fetchPreviewImage } from "./link-preview";

export type MaterialItem = {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  platform: string;
  author: string | null;
  thumbnail: string | null;
  category: string;
  tags: string[];
  notes: string;
  captureMethod: string;
  device: string;
  favorite: boolean;
  status: string;
  previewCheckedAt: string | null;
  createdAt: string;
};

export type CreateMaterialInput = {
  url: string;
  title?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  thumbnail?: string | null;
  author?: string | null;
  captureMethod?: string;
  device?: string;
};

export type MaterialCategory = {
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  createdAt: string;
};

type ItemRow = {
  id: string;
  user_id: string;
  url: string;
  normalized_url: string;
  title: string;
  platform: string;
  author: string | null;
  thumbnail: string | null;
  category: string;
  tags: string;
  notes: string;
  capture_method: string;
  device: string;
  favorite: number;
  status: string;
  preview_checked_at: string | null;
  created_at: string;
};

type CategoryRow = {
  user_id: string;
  name: string;
  color: string;
  position: number;
  is_default: number;
  created_at: string;
};

const defaultCategories = [
  { name: "灵感收集", color: "coral", position: 0 },
  { name: "产品设计", color: "blue", position: 1 },
  { name: "AI 学习", color: "purple", position: 2 },
  { name: "文字创作", color: "amber", position: 3 },
  { name: "视频创作", color: "pink", position: 4 },
  { name: "知识学习", color: "green", position: 5 },
] as const;

export const categoryPalette = [
  "cyan",
  "violet",
  "teal",
  "lime",
  "orange",
  "red",
  "coral",
  "blue",
  "amber",
  "green",
  "purple",
  "pink",
] as const;

const LEGACY_USER_ID = "__legacy_owner__";

function getBinding(): D1Database {
  if (!env.DB) {
    throw new Error("数据库暂不可用");
  }
  return env.DB;
}

export async function claimLegacyData(
  userId: string,
  email: string,
): Promise<void> {
  const legacyOwnerEmail = (
    env as unknown as { LEGACY_OWNER_EMAIL?: string }
  ).LEGACY_OWNER_EMAIL?.trim().toLowerCase();
  if (!legacyOwnerEmail || email.trim().toLowerCase() !== legacyOwnerEmail) {
    return;
  }

  const db = getBinding();
  await db.batch([
    db
      .prepare("UPDATE categories SET user_id = ? WHERE user_id = ?")
      .bind(userId, LEGACY_USER_ID),
    db
      .prepare("UPDATE items SET user_id = ? WHERE user_id = ?")
      .bind(userId, LEGACY_USER_ID),
  ]);
}

async function ensureUserCategories(userId: string): Promise<void> {
  const db = getBinding();
  await db.batch(
    defaultCategories.map((category) =>
      db
        .prepare(`
          INSERT OR IGNORE INTO categories (
            user_id, name, color, position, is_default, created_at
          ) VALUES (?, ?, ?, ?, 1, ?)
        `)
        .bind(
          userId,
          category.name,
          category.color,
          category.position,
          "2026-07-29T00:00:00.000Z",
        ),
    ),
  );
}

export async function listCategories(userId: string): Promise<MaterialCategory[]> {
  await ensureUserCategories(userId);
  const result = await getBinding()
    .prepare(
      "SELECT * FROM categories WHERE user_id = ? ORDER BY position ASC, created_at ASC, name ASC",
    )
    .bind(userId)
    .all<CategoryRow>();
  return result.results.map(mapCategoryRow);
}

export async function createCategory(
  userId: string,
  name: string,
): Promise<{ category: MaterialCategory; duplicate: boolean }> {
  await ensureUserCategories(userId);
  const db = getBinding();
  const existing = await db
    .prepare("SELECT * FROM categories WHERE user_id = ? AND name = ? LIMIT 1")
    .bind(userId, name)
    .first<CategoryRow>();

  if (existing) {
    return { category: mapCategoryRow(existing), duplicate: true };
  }

  const aggregate = await db
    .prepare(`
      SELECT
        COALESCE(MAX(position), -1) + 1 AS next_position
      FROM categories
      WHERE user_id = ?
    `)
    .bind(userId)
    .first<{ next_position: number }>();
  const colorUsage = await db
    .prepare(`
      SELECT color, COUNT(*) AS usage
      FROM categories
      WHERE user_id = ?
      GROUP BY color
    `)
    .bind(userId)
    .all<{ color: string; usage: number }>();
  const usageByColor = new Map(
    colorUsage.results.map((entry) => [entry.color, entry.usage]),
  );
  const color = categoryPalette.reduce((best, candidate) => {
    return (usageByColor.get(candidate) ?? 0) <
      (usageByColor.get(best) ?? 0)
      ? candidate
      : best;
  }, categoryPalette[0]);
  const createdAt = new Date().toISOString();
  const position = aggregate?.next_position ?? defaultCategories.length;

  const inserted = await db
    .prepare(`
      INSERT OR IGNORE INTO categories (
        user_id, name, color, position, is_default, created_at
      ) VALUES (?, ?, ?, ?, 0, ?)
    `)
    .bind(userId, name, color, position, createdAt)
    .run();

  const category = await db
    .prepare("SELECT * FROM categories WHERE user_id = ? AND name = ? LIMIT 1")
    .bind(userId, name)
    .first<CategoryRow>();

  if (!category) {
    throw new Error("分类创建失败，请稍后重试");
  }

  return {
    category: mapCategoryRow(category),
    duplicate: (inserted.meta.changes ?? 0) === 0,
  };
}

export async function renameCategory(
  userId: string,
  name: string,
  newName: string,
  newColor: (typeof categoryPalette)[number],
): Promise<{ category: MaterialCategory | null; duplicate: boolean }> {
  await ensureUserCategories(userId);
  const db = getBinding();
  const current = await db
    .prepare("SELECT * FROM categories WHERE user_id = ? AND name = ? LIMIT 1")
    .bind(userId, name)
    .first<CategoryRow>();

  if (!current) {
    return { category: null, duplicate: false };
  }
  if (name === newName && current.color === newColor) {
    return { category: mapCategoryRow(current), duplicate: false };
  }

  if (name !== newName) {
    const duplicate = await db
      .prepare("SELECT * FROM categories WHERE user_id = ? AND name = ? LIMIT 1")
      .bind(userId, newName)
      .first<CategoryRow>();
    if (duplicate) {
      return { category: mapCategoryRow(duplicate), duplicate: true };
    }
  }

  await db.batch([
    db
      .prepare("UPDATE categories SET name = ?, color = ? WHERE user_id = ? AND name = ?")
      .bind(newName, newColor, userId, name),
    db
      .prepare("UPDATE items SET category = ? WHERE user_id = ? AND category = ?")
      .bind(newName, userId, name),
  ]);

  const renamed = await db
    .prepare("SELECT * FROM categories WHERE user_id = ? AND name = ? LIMIT 1")
    .bind(userId, newName)
    .first<CategoryRow>();
  if (!renamed) {
    throw new Error("分类更新失败，请稍后重试");
  }

  return { category: mapCategoryRow(renamed), duplicate: false };
}

export async function listItems(userId: string): Promise<MaterialItem[]> {
  const result = await getBinding()
    .prepare("SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<ItemRow>();
  return result.results.map(mapRow);
}

export async function createItem(
  userId: string,
  input: CreateMaterialInput,
): Promise<{ item: MaterialItem; duplicate: boolean }> {
  const db = getBinding();
  const sourceUrl = extractHttpUrl(input.url);
  if (!sourceUrl) {
    throw new Error("分享内容中没有识别到 http 或 https 链接");
  }
  const normalizedUrl = normalizeUrl(sourceUrl);
  const existing = await db
    .prepare("SELECT * FROM items WHERE user_id = ? AND normalized_url = ? LIMIT 1")
    .bind(userId, normalizedUrl)
    .first<ItemRow>();

  if (existing) {
    return { item: mapRow(existing), duplicate: true };
  }

  const id = crypto.randomUUID();
  const platform = detectPlatform(sourceUrl);
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const createdAt = new Date().toISOString();
  const item: MaterialItem = {
    id,
    url: sourceUrl,
    normalizedUrl,
    title: input.title?.trim() || `来自 ${platform || hostname} 的新素材`,
    platform,
    author: input.author?.trim() || null,
    thumbnail: input.thumbnail || null,
    category: input.category || "收件箱",
    tags: cleanTags(input.tags ?? []),
    notes: input.notes?.trim() || "",
    captureMethod: input.captureMethod || "网页粘贴",
    device: input.device || "网页",
    favorite: false,
    status: "ready",
    previewCheckedAt: input.thumbnail ? createdAt : null,
    createdAt,
  };

  await db
    .prepare(`
      INSERT INTO items (
        id, user_id, url, normalized_url, title, platform, author, thumbnail,
        category, tags, notes, capture_method, device, favorite,
        status, preview_checked_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      item.id,
      userId,
      item.url,
      item.normalizedUrl,
      item.title,
      item.platform,
      item.author,
      item.thumbnail,
      item.category,
      JSON.stringify(item.tags),
      item.notes,
      item.captureMethod,
      item.device,
      0,
      item.status,
      item.previewCheckedAt,
      item.createdAt,
    )
    .run();

  return { item, duplicate: false };
}

export async function refreshItemPreview(
  userId: string,
  id: string,
): Promise<MaterialItem | null> {
  const db = getBinding();
  const existing = await db
    .prepare("SELECT * FROM items WHERE user_id = ? AND id = ? LIMIT 1")
    .bind(userId, id)
    .first<ItemRow>();

  if (!existing) return null;
  const current = mapRow(existing);
  const metadata = await fetchLinkPreview(current.url);
  const previewCheckedAt = new Date().toISOString();
  const shouldReplaceTitle =
    current.title.startsWith("来自 ") && current.title.endsWith(" 的新素材");
  const title =
    shouldReplaceTitle && metadata.title ? metadata.title : current.title;
  const fetchedThumbnail = metadata.image
    ? await persistPreviewImage(userId, id, metadata.image)
    : null;
  const thumbnail = fetchedThumbnail || metadata.image || current.thumbnail;
  const author = current.author || metadata.author;

  await db
    .prepare(`
      UPDATE items
      SET title = ?, author = ?, thumbnail = ?, preview_checked_at = ?
      WHERE user_id = ? AND id = ?
    `)
    .bind(title, author, thumbnail, previewCheckedAt, userId, id)
    .run();

  return {
    ...current,
    title,
    author,
    thumbnail,
    previewCheckedAt,
  };
}

export async function updateItem(
  userId: string,
  id: string,
  patch: Partial<
    Pick<MaterialItem, "title" | "category" | "tags" | "notes" | "favorite">
  >,
): Promise<MaterialItem | null> {
  const db = getBinding();
  const existing = await db
    .prepare("SELECT * FROM items WHERE user_id = ? AND id = ? LIMIT 1")
    .bind(userId, id)
    .first<ItemRow>();

  if (!existing) return null;
  const current = mapRow(existing);
  const next = {
    ...current,
    title: patch.title?.trim() || current.title,
    category: patch.category || current.category,
    tags: patch.tags ? cleanTags(patch.tags) : current.tags,
    notes: patch.notes ?? current.notes,
    favorite: patch.favorite ?? current.favorite,
  };

  await db
    .prepare(`
      UPDATE items
      SET title = ?, category = ?, tags = ?, notes = ?, favorite = ?
      WHERE user_id = ? AND id = ?
    `)
    .bind(
      next.title,
      next.category,
      JSON.stringify(next.tags),
      next.notes,
      next.favorite ? 1 : 0,
      userId,
      id,
    )
    .run();

  return next;
}

export async function deleteItem(userId: string, id: string): Promise<boolean> {
  const result = await getBinding()
    .prepare("DELETE FROM items WHERE user_id = ? AND id = ?")
    .bind(userId, id)
    .run();
  const deleted = (result.meta.changes ?? 0) > 0;
  if (deleted) {
    await getPreviewBucket()
      ?.delete([previewObjectKey(userId, id), legacyPreviewObjectKey(id)])
      .catch(() => undefined);
  }
  return deleted;
}

export async function getItem(
  userId: string,
  id: string,
): Promise<MaterialItem | null> {
  const row = await getBinding()
    .prepare("SELECT * FROM items WHERE user_id = ? AND id = ? LIMIT 1")
    .bind(userId, id)
    .first<ItemRow>();
  return row ? mapRow(row) : null;
}

function mapRow(row: ItemRow): MaterialItem {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    url: row.url,
    normalizedUrl: row.normalized_url,
    title: row.title,
    platform: row.platform,
    author: row.author,
    thumbnail: row.thumbnail,
    category: row.category,
    tags,
    notes: row.notes,
    captureMethod: row.capture_method,
    device: row.device,
    favorite: Boolean(row.favorite),
    status: row.status,
    previewCheckedAt: row.preview_checked_at ?? null,
    createdAt: row.created_at,
  };
}

function mapCategoryRow(row: CategoryRow): MaterialCategory {
  return {
    name: row.name,
    color: row.color,
    position: row.position,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

function normalizeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("请输入完整的 http 或 https 链接");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("仅支持 http 或 https 链接");
  }
  url.hash = "";
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(
    (key) => url.searchParams.delete(key),
  );
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function detectPlatform(value: string): string {
  const host = new URL(value).hostname.toLowerCase();
  if (host.includes("douyin.com")) return "抖音";
  if (host.includes("xiaohongshu.com") || host.includes("xhslink.com"))
    return "小红书";
  if (host.includes("bilibili.com") || host.includes("b23.tv")) return "B站";
  if (host.includes("weibo.com")) return "微博";
  if (host.includes("zhihu.com")) return "知乎";
  if (host.includes("weixin.qq.com")) return "微信公众号";
  if (host.includes("youtube.com") || host.includes("youtu.be"))
    return "YouTube";
  if (host.includes("pinterest.com") || host === "pin.it") return "Pinterest";
  if (host.includes("unsplash.com")) return "Unsplash";
  return host.replace(/^www\./, "");
}

function cleanTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).slice(0, 12);
}

function getPreviewBucket(): R2Bucket | null {
  return (
    (env as unknown as { PREVIEWS?: R2Bucket }).PREVIEWS ??
    null
  );
}

async function persistPreviewImage(
  userId: string,
  itemId: string,
  imageUrl: string,
): Promise<string | null> {
  const bucket = getPreviewBucket();
  if (!bucket) return null;

  const image = await fetchPreviewImage(imageUrl);
  if (!image) return null;
  await bucket.put(previewObjectKey(userId, itemId), image.bytes, {
    httpMetadata: {
      contentType: image.contentType,
      cacheControl: "private, max-age=31536000, immutable",
    },
  });
  return `/api/preview-image?id=${encodeURIComponent(itemId)}&v=${Date.now()}`;
}

export function previewObjectKey(userId: string, itemId: string): string {
  return `previews/users/${encodeURIComponent(userId)}/${itemId}`;
}

export function legacyPreviewObjectKey(itemId: string): string {
  return `previews/${itemId}`;
}
