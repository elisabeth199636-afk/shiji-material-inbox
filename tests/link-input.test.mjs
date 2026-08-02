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

test("extracts a Bilibili URL from title and share parameters", () => {
  const shareText =
    "【从刺杀权贵的革命者到大汉奸，汪精卫为什么转变？【历史调研室103】】 https://www.bilibili.com/video/BV1W4Gw62ErS/?share_source=copy_web&vd_source=4791a27ae8d7bba701481542a6488deb";

  assert.equal(
    extractHttpUrl(shareText),
    "https://www.bilibili.com/video/BV1W4Gw62ErS/?share_source=copy_web&vd_source=4791a27ae8d7bba701481542a6488deb",
  );
});

test("extracts a Douyin short link from command-style share copy", () => {
  const shareText =
    "9.25 OXZ:/ 11/11 T@L.jP :3pm 品鉴下网友强推的盒马零食 # 盒马 # 零食 # 测评# 吃货 # 种草  https://v.douyin.com/vzCnQXBRHDk/ 复制此链接，打开Dou音搜索，直接观看视频！";

  assert.equal(
    extractHttpUrl(shareText),
    "https://v.douyin.com/vzCnQXBRHDk/",
  );
});

test("keeps Pinterest pin and short-link URLs", () => {
  assert.equal(
    extractHttpUrl("https://www.pinterest.com/pin/819655200979166983/"),
    "https://www.pinterest.com/pin/819655200979166983/",
  );
  assert.equal(
    extractHttpUrl("Pinterest 灵感 https://pin.it/example"),
    "https://pin.it/example",
  );
});
