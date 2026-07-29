import { env } from "cloudflare:workers";

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

type ItemRow = {
  id: string;
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
  created_at: string;
};

const seedItems: Array<CreateMaterialInput & { id: string; createdAt: string }> = [
  {
    id: "sample-workspace",
    url: "https://unsplash.com/photos/a-person-is-typing-on-a-computer-keyboard-aNwGNIAi7Kk",
    title: "让创作桌面保持专注的收纳方式",
    category: "灵感收集",
    tags: ["工作流", "桌面", "效率"],
    notes: "桌面布局清晰，适合作为工作区整理与拍摄构图参考。",
    thumbnail: "/demo/workspace.jpg",
    author: "Amr Taha",
    captureMethod: "浏览器扩展",
    device: "Mac",
    createdAt: "2026-07-29T09:42:00.000Z",
  },
  {
    id: "sample-robot",
    url: "https://unsplash.com/photos/white-robot-wallpaper-JjGXjESMxOY",
    title: "AI 产品视觉：克制的未来感",
    category: "AI 学习",
    tags: ["AI", "视觉风格", "产品"],
    notes: "避免霓虹赛博朋克，黑白高反差更适合严肃的 AI 产品表达。",
    thumbnail: "/demo/robot.jpg",
    author: "Possessed Photography",
    captureMethod: "网页粘贴",
    device: "Windows",
    createdAt: "2026-07-29T08:16:00.000Z",
  },
  {
    id: "sample-travel-rock",
    url: "https://unsplash.com/photos/a-woman-standing-on-a-rock-in-the-water-02fgSTavbyE",
    title: "湖边人物与自然景观的取景关系",
    category: "灵感收集",
    tags: ["旅行", "摄影", "构图"],
    notes: "人物放在画面边缘，给湖面与山体留下更多呼吸空间。",
    thumbnail: "/demo/travel-rock.jpg",
    author: "Josh Hild",
    captureMethod: "手机分享",
    device: "iPhone",
    createdAt: "2026-07-28T15:20:00.000Z",
  },
  {
    id: "sample-mountain",
    url: "https://unsplash.com/photos/person-enjoys-a-stunning-view-of-lake-and-mountains-r1LiDUXcp5Q",
    title: "把旅行目的地做成内容专题",
    category: "灵感收集",
    tags: ["新西兰", "旅行计划", "专题"],
    notes: "可以继续补充交通、住宿和徒步路线，组合成一个专题。",
    thumbnail: "/demo/mountain-view.jpg",
    author: "Tobias Rademacher",
    captureMethod: "操作按钮",
    device: "iPhone",
    createdAt: "2026-07-28T11:08:00.000Z",
  },
  {
    id: "sample-lake",
    url: "https://unsplash.com/photos/a-mountain-range-with-a-lake-in-the-foreground-5CbjzGrni4c",
    title: "冷色风景影像的层次控制",
    category: "灵感收集",
    tags: ["调色", "风景", "摄影"],
    notes: "远山、湖面和前景保持三个清晰层次，适合做封面图。",
    thumbnail: "/demo/lake.jpg",
    author: "Alexander Klimm",
    captureMethod: "浏览器快捷键",
    device: "Mac",
    createdAt: "2026-07-27T06:35:00.000Z",
  },
  {
    id: "sample-social",
    url: "https://www.douyin.com/",
    title: "短视频开场前 3 秒的结构拆解",
    category: "收件箱",
    tags: ["短视频", "开场", "待整理"],
    notes: "",
    thumbnail: null,
    author: "来自抖音",
    captureMethod: "手机分享",
    device: "iPhone",
    createdAt: "2026-07-27T01:12:00.000Z",
  },
];

function getBinding(): D1Database {
  if (!env.DB) {
    throw new Error("数据库暂不可用");
  }
  return env.DB;
}

export async function ensureDatabase(): Promise<void> {
  const db = getBinding();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        normalized_url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        author TEXT,
        thumbnail TEXT,
        category TEXT NOT NULL DEFAULT '收件箱',
        tags TEXT NOT NULL DEFAULT '[]',
        notes TEXT NOT NULL DEFAULT '',
        capture_method TEXT NOT NULL DEFAULT '网页粘贴',
        device TEXT NOT NULL DEFAULT '网页',
        favorite INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ready',
        created_at TEXT NOT NULL
      )
    `),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS items_created_at_idx ON items(created_at DESC)",
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS items_category_idx ON items(category)",
    ),
    db.prepare(
      "UPDATE items SET category = '灵感收集' WHERE category IN ('创作参考', '生活灵感', '想买清单')",
    ),
    db.prepare(
      "UPDATE items SET category = 'AI 学习' WHERE category = 'AI 与工具'",
    ),
    db.prepare(
      "UPDATE items SET category = '文字创作' WHERE category = '营销增长'",
    ),
  ]);

  const count = await db
    .prepare("SELECT COUNT(*) AS count FROM items")
    .first<{ count: number }>();

  if ((count?.count ?? 0) === 0) {
    await db.batch(
      seedItems.map((item) => {
        const normalizedUrl = normalizeUrl(item.url);
        return db
          .prepare(`
            INSERT OR IGNORE INTO items (
              id, url, normalized_url, title, platform, author, thumbnail,
              category, tags, notes, capture_method, device, favorite,
              status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'ready', ?)
          `)
          .bind(
            item.id,
            item.url,
            normalizedUrl,
            item.title,
            detectPlatform(item.url),
            item.author ?? null,
            item.thumbnail ?? null,
            item.category ?? "收件箱",
            JSON.stringify(item.tags ?? []),
            item.notes ?? "",
            item.captureMethod ?? "网页粘贴",
            item.device ?? "网页",
            item.createdAt,
          );
      }),
    );
  }
}

export async function listItems(): Promise<MaterialItem[]> {
  await ensureDatabase();
  const result = await getBinding()
    .prepare("SELECT * FROM items ORDER BY created_at DESC")
    .all<ItemRow>();
  return result.results.map(mapRow);
}

export async function createItem(
  input: CreateMaterialInput,
): Promise<{ item: MaterialItem; duplicate: boolean }> {
  await ensureDatabase();
  const db = getBinding();
  const normalizedUrl = normalizeUrl(input.url);
  const existing = await db
    .prepare("SELECT * FROM items WHERE normalized_url = ? LIMIT 1")
    .bind(normalizedUrl)
    .first<ItemRow>();

  if (existing) {
    return { item: mapRow(existing), duplicate: true };
  }

  const id = crypto.randomUUID();
  const platform = detectPlatform(input.url);
  const hostname = new URL(input.url).hostname.replace(/^www\./, "");
  const item: MaterialItem = {
    id,
    url: input.url,
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
    createdAt: new Date().toISOString(),
  };

  await db
    .prepare(`
      INSERT INTO items (
        id, url, normalized_url, title, platform, author, thumbnail,
        category, tags, notes, capture_method, device, favorite,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      item.id,
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
      item.createdAt,
    )
    .run();

  return { item, duplicate: false };
}

export async function updateItem(
  id: string,
  patch: Partial<
    Pick<MaterialItem, "title" | "category" | "tags" | "notes" | "favorite">
  >,
): Promise<MaterialItem | null> {
  await ensureDatabase();
  const db = getBinding();
  const existing = await db
    .prepare("SELECT * FROM items WHERE id = ? LIMIT 1")
    .bind(id)
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
      WHERE id = ?
    `)
    .bind(
      next.title,
      next.category,
      JSON.stringify(next.tags),
      next.notes,
      next.favorite ? 1 : 0,
      id,
    )
    .run();

  return next;
}

export async function deleteItem(id: string): Promise<boolean> {
  await ensureDatabase();
  const result = await getBinding()
    .prepare("DELETE FROM items WHERE id = ?")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
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
  if (host.includes("unsplash.com")) return "Unsplash";
  return host.replace(/^www\./, "");
}

function cleanTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).slice(0, 12);
}
