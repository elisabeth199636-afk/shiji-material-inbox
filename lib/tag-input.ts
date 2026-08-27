export function normalizeTag(value: string) {
  return value.trim().replace(/^#+/, "").replace(/\s+/g, " ");
}

export function parseTagInput(value: string) {
  return value
    .split(/[,，、]/)
    .map(normalizeTag)
    .filter(Boolean);
}

export function getCurrentTagDraft(value: string) {
  const parts = value.split(/[,，、]/);
  return normalizeTag(parts[parts.length - 1] ?? "");
}

export function getCommittedTags(value: string) {
  const parts = value.split(/[,，、]/);
  return parts.slice(0, -1).map(normalizeTag).filter(Boolean);
}

export function getTagSuggestions(
  knownTags: string[],
  draft: string,
  excludedTags: string[],
) {
  const query = normalizeTag(draft).toLocaleLowerCase("zh-CN");
  if (!query) return [];
  const excluded = new Set(
    excludedTags.map((tag) => tag.toLocaleLowerCase("zh-CN")),
  );
  return knownTags
    .filter((tag) => {
      const normalized = tag.toLocaleLowerCase("zh-CN");
      return normalized.startsWith(query) && !excluded.has(normalized);
    })
    .slice(0, 6);
}

export function replaceCurrentTag(value: string, selectedTag: string) {
  const nextTags = [...getCommittedTags(value), normalizeTag(selectedTag)];
  const uniqueTags = nextTags.filter(
    (tag, index) =>
      nextTags.findIndex(
        (candidate) =>
          candidate.toLocaleLowerCase("zh-CN") ===
          tag.toLocaleLowerCase("zh-CN"),
      ) === index,
  );
  return uniqueTags.length > 0 ? `${uniqueTags.join("，")}，` : "";
}
