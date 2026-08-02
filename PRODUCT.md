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

选中左侧某个分类后，分类右侧显示三点操作按钮。点击后可在原位修改分类名称，并从 12 个色标中选择分类颜色；当前颜色具有明确选中态，可确认、取消或按 Esc 退出。保存后同步更新筛选标题、左侧色标、素材卡片、详情面板和该分类下的所有素材，刷新或换设备后仍然保留。

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

Pinterest 的 `pinterest.com/pin/...` 内容链接和 `pin.it` 短链统一识别为“Pinterest”来源。

左侧栏品牌区仅保留 Logo、产品名和说明，不显示关闭叉号；窄屏侧栏通过遮罩、导航选择或 Esc 关闭。

搜索框聚焦时展示当前设备最近 8 条搜索记录。记录在 Enter 或离开搜索框时保存，按最近使用排序并去重；支持重新选择、输入筛选和清空全部记录，不写入云端数据库。

标签输入具有云端历史联想。用户在添加素材或详情编辑中输入第一个字后，系统从已有素材使用过的标签中进行前缀匹配，按使用频率和最近出现顺序提供最多 6 个候选，并排除当前素材已经选择的标签。候选支持点击、方向键和回车确认；历史来源于云端素材数据，因此手机与电脑保持一致。

顶部菜单图标仅在侧栏转为抽屉的窄屏布局显示，桌面端隐藏。中间素材区向下滚动超过 240px 后，右下角显示回到顶部按钮；点击后平滑滚动，减少动态效果模式下立即跳转。
