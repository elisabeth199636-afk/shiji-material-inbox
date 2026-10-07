import { env } from "cloudflare:workers";

export const PREVIEW_RATE_LIMIT_MAX = 30;
export const PREVIEW_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type PreviewRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type CounterRow = {
  request_count: number;
};

function getBinding(): D1Database {
  if (!env.DB) {
    throw new Error("数据库暂不可用");
  }
  return env.DB;
}

export async function consumePreviewRateLimit(
  userId: string,
  now = Date.now(),
): Promise<PreviewRateLimitResult> {
  const windowStartedAt =
    Math.floor(now / PREVIEW_RATE_LIMIT_WINDOW_MS) *
    PREVIEW_RATE_LIMIT_WINDOW_MS;
  const counter = await getBinding()
    .prepare(`
      INSERT INTO preview_rate_limits (
        user_id, window_started_at, request_count, updated_at
      ) VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, window_started_at)
      DO UPDATE SET
        request_count = request_count + 1,
        updated_at = excluded.updated_at
      RETURNING request_count
    `)
    .bind(userId, windowStartedAt, new Date(now).toISOString())
    .first<CounterRow>();

  if (!counter) {
    throw new Error("暂时无法检查预览读取频率");
  }

  if (counter.request_count === 1) {
    await getBinding()
      .prepare(`
        DELETE FROM preview_rate_limits
        WHERE user_id = ? AND window_started_at < ?
      `)
      .bind(userId, windowStartedAt)
      .run();
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(
      (windowStartedAt + PREVIEW_RATE_LIMIT_WINDOW_MS - now) / 1000,
    ),
  );

  return {
    allowed: counter.request_count <= PREVIEW_RATE_LIMIT_MAX,
    remaining: Math.max(0, PREVIEW_RATE_LIMIT_MAX - counter.request_count),
    retryAfterSeconds,
  };
}
