export type LinkPreviewMetadata = {
  title: string | null;
  image: string | null;
  author: string | null;
  finalUrl: string | null;
};

export type PreviewImageAsset = {
  bytes: ArrayBuffer;
  contentType: string;
};

const MAX_HTML_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 10000;

export async function fetchLinkPreview(
  value: string,
): Promise<LinkPreviewMetadata> {
  const empty: LinkPreviewMetadata = {
    title: null,
    image: null,
    author: null,
    finalUrl: null,
  };

  try {
    let currentUrl = new URL(value);
    if (!isSafePublicUrl(currentUrl)) return empty;

    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.7",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0 Safari/537.36",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location || redirect === MAX_REDIRECTS) return empty;
        const nextUrl = new URL(location, currentUrl);
        if (!isSafePublicUrl(nextUrl)) return empty;
        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        return empty;
      }

      const contentType = response.headers.get("content-type")?.toLowerCase();
      if (
        contentType &&
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")
      ) {
        await response.body?.cancel().catch(() => undefined);
        return empty;
      }

      const html = await readResponseSnippet(response, MAX_HTML_BYTES);
      return extractLinkPreviewMetadata(html, currentUrl);
    }
  } catch (error) {
    console.warn(
      "[preview] metadata fetch failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return empty;
  }

  return empty;
}

export async function fetchPreviewImage(
  value: string,
): Promise<PreviewImageAsset | null> {
  try {
    let currentUrl = new URL(value);
    if (!isSafePublicUrl(currentUrl)) return null;

    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0 Safari/537.36",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location || redirect === MAX_REDIRECTS) return null;
        const nextUrl = new URL(location, currentUrl);
        if (!isSafePublicUrl(nextUrl)) return null;
        currentUrl = nextUrl;
        continue;
      }

      const contentType = response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase();
      const supportedTypes = new Set([
        "image/avif",
        "image/gif",
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);
      if (!response.ok || !contentType || !supportedTypes.has(contentType)) {
        await response.body?.cancel().catch(() => undefined);
        return null;
      }

      const declaredLength = Number(
        response.headers.get("content-length") ?? "0",
      );
      if (declaredLength > MAX_IMAGE_BYTES) {
        await response.body?.cancel().catch(() => undefined);
        return null;
      }

      const bytes = await readResponseBytes(response, MAX_IMAGE_BYTES);
      if (!bytes) return null;
      return {
        bytes: bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        contentType,
      };
    }
  } catch (error) {
    console.warn(
      "[preview] image fetch failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }

  return null;
}

export function extractLinkPreviewMetadata(
  html: string,
  baseUrl: URL,
): LinkPreviewMetadata {
  const metadata = new Map<string, string>();
  const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attributes = parseAttributes(tag);
    if (tag.toLowerCase().startsWith("<meta")) {
      const key = (
        attributes.property ||
        attributes.name ||
        attributes.itemprop ||
        ""
      ).toLowerCase();
      const content = attributes.content || attributes.value;
      if (key && content && !metadata.has(key)) {
        metadata.set(key, decodeMarkup(content));
      }
      continue;
    }

    const rel = attributes.rel?.toLowerCase();
    if (rel?.split(/\s+/).includes("image_src") && attributes.href) {
      metadata.set("link:image_src", decodeMarkup(attributes.href));
    }
  }

  const documentTitle =
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const jsonImage =
    html.match(
      /"(?:origin_cover|dynamic_cover|cover|image_url|thumbnailUrl|thumbnail_url)"\s*:\s*"((?:\\.|[^"\\])+)"/i,
    )?.[1] ?? "";
  const jsonTitle =
    html.match(/"(?:desc|title)"\s*:\s*"((?:\\.|[^"\\])+)"/i)?.[1] ?? "";

  const title = firstUsefulValue([
    metadata.get("og:title"),
    metadata.get("twitter:title"),
    metadata.get("title"),
    decodeMarkup(documentTitle),
    decodeEscapedJson(jsonTitle),
  ]);
  const author = firstUsefulValue([
    metadata.get("article:author"),
    metadata.get("author"),
    metadata.get("twitter:creator"),
  ]);
  const rawImage = firstUsefulValue([
    metadata.get("og:image:secure_url"),
    metadata.get("og:image:url"),
    metadata.get("og:image"),
    metadata.get("twitter:image"),
    metadata.get("twitter:image:src"),
    metadata.get("image"),
    metadata.get("link:image_src"),
    decodeEscapedJson(jsonImage),
    findFallbackImage(html),
  ]);

  return {
    title,
    image: resolveSafeImageUrl(rawImage, baseUrl),
    author,
    finalUrl: baseUrl.toString(),
  };
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern =
    /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function findFallbackImage(html: string): string | null {
  const images = (html.match(/<img\b[^>]*>/gi) ?? []).slice(0, 40);
  for (const image of images) {
    const attributes = parseAttributes(image);
    const source =
      attributes["data-original"] ||
      attributes["data-src"] ||
      attributes.src ||
      attributes.srcset?.split(",").at(-1)?.trim().split(/\s+/)[0];
    if (!source || source.startsWith("data:")) continue;

    const hint = `${source} ${attributes.alt ?? ""} ${attributes.class ?? ""}`.toLowerCase();
    if (/(?:avatar|emoji|favicon|icon|logo|sprite|tracking)/.test(hint)) {
      continue;
    }

    const width = Number.parseInt(attributes.width ?? "0", 10);
    const height = Number.parseInt(attributes.height ?? "0", 10);
    if ((width > 0 && width < 240) || (height > 0 && height < 160)) {
      continue;
    }
    return decodeMarkup(source);
  }
  return null;
}

function firstUsefulValue(
  values: Array<string | null | undefined>,
): string | null {
  for (const value of values) {
    const normalized = value?.replace(/\s+/g, " ").trim();
    if (normalized) return normalized;
  }
  return null;
}

function resolveSafeImageUrl(value: string | null, baseUrl: URL): string | null {
  if (!value) return null;
  try {
    const imageUrl = new URL(value, baseUrl);
    return isSafePublicUrl(imageUrl) ? imageUrl.toString() : null;
  } catch {
    return null;
  }
}

function decodeEscapedJson(value: string): string {
  if (!value) return "";
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value
      .replace(/\\u002f/gi, "/")
      .replace(/\\u003a/gi, ":")
      .replace(/\\u0026/gi, "&")
      .replace(/\\\//g, "/");
  }
}

function decodeMarkup(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .trim();
}

function isSafePublicUrl(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  const host = url.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return false;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return false;
    if (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] >= 224
    ) {
      return false;
    }
  }

  return !(
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb")
  );
}

async function readResponseSnippet(
  response: Response,
  maximumBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maximumBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maximumBytes - total;
    const chunk =
      value.byteLength > remaining ? value.slice(0, remaining) : value;
    chunks.push(chunk);
    total += chunk.byteLength;
    if (value.byteLength > remaining) {
      await reader.cancel().catch(() => undefined);
      break;
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

async function readResponseBytes(
  response: Response,
  maximumBytes: number,
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}
