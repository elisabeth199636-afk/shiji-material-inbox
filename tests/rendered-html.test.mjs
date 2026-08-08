import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the material inbox product surface", async () => {
  const [
    page,
    layout,
    client,
    categoriesRoute,
    previewRoute,
    previewImageRoute,
    linkPreview,
    itemsSource,
    globals,
    hosting,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MaterialInbox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/categories/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/items/preview/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/preview-image/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/link-preview.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/items.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(page, /MaterialInbox/);
  assert.match(layout, /拾集 · 灵感素材库/);
  assert.match(layout, /og\.png/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(layout, /width: "device-width"/);
  assert.match(client, /添加素材/);
  assert.match(client, /素材详情/);
  assert.match(client, /\/api\/items/);
  assert.match(client, /\/api\/categories/);
  assert.match(client, /\/api\/items\/preview/);
  assert.match(client, /输入分类名称/);
  assert.match(client, /读取预览/);
  assert.match(client, /已从分享文案中识别出链接/);
  assert.match(client, /Pinterest 等网页链接/);
  assert.doesNotMatch(client, /sidebar-close/);
  assert.match(client, /最近搜索/);
  assert.match(client, /清空记录/);
  assert.match(client, /shiji\.search-history/);
  assert.match(client, /knownTags/);
  assert.match(client, /getTagSuggestions/);
  assert.match(client, /startsWith\(query\)/);
  assert.match(client, /TagSuggestionMenu/);
  assert.match(client, /历史标签/);
  assert.match(client, /aria-autocomplete="list"/);
  assert.match(client, /capture-tag-suggestions/);
  assert.match(client, /detail-tag-suggestions/);
  assert.match(client, /mobile-bottom-nav/);
  assert.match(client, /mobile-add-button/);
  assert.match(client, /capture-mobile-scrim/);
  assert.match(client, /手机端主导航/);
  assert.match(client, /compactViewport/);
  assert.match(client, /back-to-top/);
  assert.match(client, /回到素材列表顶部/);
  assert.match(client, /scrollTop > 240/);
  assert.match(client, /category-more/);
  assert.match(client, /category-rename/);
  assert.match(client, /category-color-picker/);
  assert.match(client, /CATEGORY_COLOR_OPTIONS/);
  assert.match(client, /选择分类颜色/);
  assert.match(client, /重命名分类/);
  assert.match(globals, /\.mobile-menu\.icon-button\s*\{\s*display: none/);
  assert.match(globals, /\.mobile-bottom-nav/);
  assert.match(globals, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(globals, /env\(safe-area-inset-bottom\)/);
  assert.match(globals, /height: 100dvh/);
  assert.match(globals, /font-size: 16px/);
  assert.match(globals, /\.asset-grid\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(globals, /\.capture-mobile-scrim/);
  assert.match(globals, /\.capture-tray::before/);
  assert.match(globals, /\.tag-suggestions/);
  assert.match(globals, /\.capture-form \.field-tags/);
  assert.doesNotMatch(globals, /\.capture-form \.field:last-of-type/);
  assert.match(client, /extractHttpUrl/);
  assert.match(client, /const GENERAL_DEFAULT_COVER = "\/default-cover\.jpg"/);
  assert.match(client, /CATEGORY_DEFAULT_COVERS/);
  for (const cover of [
    "inspiration.jpg",
    "product.jpg",
    "ai.jpg",
    "writing.jpg",
    "video.jpg",
    "learning.jpg",
  ]) {
    assert.match(client, new RegExp(`/default-covers/${cover}`));
  }
  assert.match(client, /<DefaultPreview/);
  assert.match(client, /card-category-badge/);
  assert.match(client, /categoryColor=\{categoryColors\[item\.category\]/);
  assert.match(categoriesRoute, /createCategory/);
  assert.match(categoriesRoute, /export async function PATCH/);
  assert.match(categoriesRoute, /renameCategory/);
  assert.match(categoriesRoute, /请选择有效的分类颜色/);
  assert.match(categoriesRoute, /分类名称请控制在 12 个字以内/);
  assert.match(linkPreview, /MAX_REDIRECTS/);
  assert.match(itemsSource, /SELECT color, COUNT\(\*\) AS usage/);
  assert.match(itemsSource, /usageByColor\.get\(candidate\)/);
  assert.match(itemsSource, /UPDATE categories SET name = \?, color = \?/);
  assert.match(itemsSource, /UPDATE items SET category/);
  assert.match(itemsSource, /return "Pinterest"/);
  assert.match(itemsSource, /pin\.it/);
  for (const color of ["teal", "lime", "orange", "red"]) {
    assert.match(globals, new RegExp(`category-dot\\.${color}`));
  }
  assert.match(previewRoute, /refreshItemPreview/);
  assert.match(previewImageRoute, /PREVIEWS/);
  assert.match(previewImageRoute, /X-Content-Type-Options/);
  assert.match(linkPreview, /og:image/);
  assert.match(linkPreview, /twitter:image/);
  for (const category of [
    "灵感收集",
    "产品设计",
    "AI 学习",
    "文字创作",
    "视频创作",
    "知识学习",
  ]) {
    assert.match(client, new RegExp(category));
  }
  assert.doesNotMatch(client, /通识学习/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "PREVIEWS"/);
  assert.doesNotMatch(
    `${page}\n${layout}\n${client}`,
    /codex-preview|SkeletonPreview|Your site is taking shape/i,
  );
});
