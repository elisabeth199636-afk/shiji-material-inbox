import { env } from "cloudflare:workers";
import {
  getItem,
  legacyPreviewObjectKey,
  previewObjectKey,
} from "../../../db/items";
import { getApiUser } from "../api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return new Response("请先使用 ChatGPT 登录", { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-z-]{1,80}$/i.test(id)) {
    return new Response("Invalid preview id", { status: 400 });
  }

  const bucket = (env as unknown as { PREVIEWS?: R2Bucket }).PREVIEWS;
  if (!bucket) {
    return new Response("Preview storage unavailable", { status: 503 });
  }

  const item = await getItem(user.id, id);
  if (!item) {
    return new Response("Preview not found", { status: 404 });
  }

  const storageKey = previewObjectKey(user.id, id);
  let image = await bucket.get(storageKey);
  if (!image) {
    const legacyKey = legacyPreviewObjectKey(id);
    const legacyImage = await bucket.get(legacyKey);
    if (legacyImage) {
      const bytes = await legacyImage.arrayBuffer();
      await bucket.put(storageKey, bytes, {
        httpMetadata: legacyImage.httpMetadata,
        customMetadata: legacyImage.customMetadata,
      });
      await bucket.delete(legacyKey);
      image = await bucket.get(storageKey);
    }
  }
  if (!image) {
    return new Response("Preview not found", { status: 404 });
  }

  const headers = new Headers();
  image.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=31536000, immutable");
  headers.set("ETag", image.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(image.body, { headers });
}
