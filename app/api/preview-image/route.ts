import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-z-]{1,80}$/i.test(id)) {
    return new Response("Invalid preview id", { status: 400 });
  }

  const bucket = (env as unknown as { PREVIEWS?: R2Bucket }).PREVIEWS;
  if (!bucket) {
    return new Response("Preview storage unavailable", { status: 503 });
  }

  const image = await bucket.get(`previews/${id}`);
  if (!image) {
    return new Response("Preview not found", { status: 404 });
  }

  const headers = new Headers();
  image.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", image.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(image.body, { headers });
}
