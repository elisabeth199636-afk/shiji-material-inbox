import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the material inbox product surface", async () => {
  const [page, layout, client, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MaterialInbox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(page, /MaterialInbox/);
  assert.match(layout, /拾集 · 灵感素材库/);
  assert.match(layout, /og\.png/);
  assert.match(client, /添加素材/);
  assert.match(client, /素材详情/);
  assert.match(client, /\/api\/items/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(
    `${page}\n${layout}\n${client}`,
    /codex-preview|SkeletonPreview|Your site is taking shape/i,
  );
});
