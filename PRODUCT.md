# 拾集

## Register

product

## Users

需要在手机与电脑之间持续收集社交媒体链接、网页、灵感图片和工作资料的个人创作者与设计师。

## Product Purpose

把跨平台素材先可靠地收进同一个收件箱，再用分类、标签、收藏与搜索让素材重新可用。第一版的成功标准是保存动作足够快、数据刷新后仍存在，并且用户能快速找回内容。

## Design Principles

- 先保存，后整理。
- 桌面端保持高信息密度，但不牺牲清晰度。
- 手机端把收集与快速回看放在首位。
- 解析失败时也保留原始链接。
- 熟悉的文件管理交互优先于装饰性设计。

## Default Taxonomy

“收件箱”是所有新素材的系统入口，不属于正式内容分类。正式分类按素材用途划分为：

- 灵感收集
- 产品设计
- AI 学习
- 文字创作
- 视频创作
- 知识学习

用户可以从左侧分类区继续创建自己的分类；自定义分类需要跨设备保存，并同步出现在素材录入和详情编辑中。

## Link Preview

保存网页链接后，素材库在不阻塞保存动作的前提下读取网页公开的标题和预览图。历史素材首次加载时自动补全；平台未提供公开图片或限制访问时保留原始链接，并允许用户手动重试。

链接没有公开封面或封面加载失败时，统一使用 Amr Taha 在 Unsplash 发布的桌面工作区原图作为默认封面；来源平台标签保持不变。

默认封面来源：https://unsplash.com/photos/a-person-is-typing-on-a-computer-keyboard-aNwGNIAi7Kk

正式分类使用各自的兜底封面：

- 灵感收集：https://unsplash.com/photos/a-hand-stretches-blue-goo-dripping-downwards-ExTD4l34Mak
- 产品设计：https://unsplash.com/photos/person-using-laptop-vZJdYl5JVXY
- AI 学习：https://unsplash.com/photos/an-abstract-image-of-a-sphere-with-dots-and-lines-nGoCBxiaRO0
- 文字创作：https://unsplash.com/photos/person-holding-ballpoint-pen-writing-on-notebook-505eectW54k
- 视频创作：https://unsplash.com/photos/a-person-edits-video-at-a-modern-computer-setup-xGklNeRfBK8
- 知识学习：https://unsplash.com/photos/creative-artists-studio-with-easel-painting-and-art-supplies-QnYqq6tlVq8

收件箱和用户自定义分类继续使用通用桌面工作区封面。

网格首页的每张素材卡片在封面左上角显示分类色点和分类名称，颜色与左侧分类导航保持一致。

创建自定义分类时优先分配尚未使用的色标；色板全部使用后，选择当前使用次数最少的颜色，尽量延后重复。

素材输入既支持纯网址，也支持小红书等平台生成的整段分享文案。系统从标题、口令、表情和说明文字中提取第一个 http 或 https 链接；网页端和服务端采用相同规则。

分享文案识别覆盖小红书、抖音和 B站的常见复制格式，包括 B站标题加长链接，以及抖音口令、话题、短链接和“复制此链接”引导文字的组合。
