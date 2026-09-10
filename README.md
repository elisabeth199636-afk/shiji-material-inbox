# 拾集 · 个人灵感素材库

在手机和电脑上收集社交媒体链接、网页、灵感图片与工作资料，并通过分类、标签、收藏和搜索重新找到内容。

## A/B 版本

| 版本 | 视觉风格 | GitHub 分支 | 使用状态 |
| --- | --- | --- | --- |
| A · 经典紫色版 | 深色侧栏，紫色主操作与选中态 | [`variant/a-classic-purple`](https://github.com/elisabeth199636-afk/shiji-material-inbox/tree/variant/a-classic-purple) | 保留，可随时查看、下载或继续开发 |
| B · 黑白简约版 | 白色工作区，黑色主操作与选中态 | [`variant/b-monochrome`](https://github.com/elisabeth199636-afk/shiji-material-inbox/tree/variant/b-monochrome) | 当前版本，可直接使用 |

当前在线运行的是 B · 黑白简约版：

[打开拾集](https://shiji-material-inbox.elisabeth199636.chatgpt.site)

`main` 用于后续持续更新；A、B 两个版本分支作为平行基线保留，互不覆盖。

## 主要功能

- 支持小红书、抖音、B 站、Pinterest 与普通网页分享链接
- 自动读取链接标题和预览图，失败时按分类显示兜底封面
- 自定义分类名称与颜色
- 标签历史联想、收藏、搜索记录与详情编辑
- 桌面端多列素材库与 iPhone 单列采集体验
- 云端保存素材、分类和标签数据

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

构建和验证：

```bash
npm test
```
