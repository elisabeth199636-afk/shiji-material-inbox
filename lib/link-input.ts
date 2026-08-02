const HTTP_URL_PATTERN = /https?:\/\/[^\s<>"'`]+/iu;
const TRAILING_PUNCTUATION = /[.,;!?，。；！？、:：)\]】}>」』]+$/u;

export function extractHttpUrl(value: string): string | null {
  const normalized = value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  const match = normalized.match(HTTP_URL_PATTERN);
  if (!match) return null;

  const candidate = match[0].replace(TRAILING_PUNCTUATION, "");
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
