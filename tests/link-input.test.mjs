import assert from "node:assert/strict";
import test from "node:test";

import { extractHttpUrl } from "../lib/link-input.ts";

test("extracts a Xiaohongshu URL from complete share copy", () => {
  const shareText =
    "33 【分享999个ins博主 | NO.8 ki.iy - archive_z | 小红书】 😆 Mf6Auni3M5i9bjj 😆 https://www.xiaohongshu.com/discovery/item/69760e7d000000000a03ca55?source=webshare&xhsshare=pc_web&xsec_token=ABtFOStNP2zgvmF8CJ5ePbELzSvSUsXaxYes6CBvNdBLA=&xsec_source=pc_share";

  assert.equal(
    extractHttpUrl(shareText),
    "https://www.xiaohongshu.com/discovery/item/69760e7d000000000a03ca55?source=webshare&xhsshare=pc_web&xsec_token=ABtFOStNP2zgvmF8CJ5ePbELzSvSUsXaxYes6CBvNdBLA=&xsec_source=pc_share",
  );
});

test("keeps a plain URL and removes trailing share punctuation", () => {
  assert.equal(
    extractHttpUrl("https://xhslink.com/a/example。"),
    "https://xhslink.com/a/example",
  );
  assert.equal(extractHttpUrl("没有网址的分享文字"), null);
});
