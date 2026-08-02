"use client";

import {
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Grid2X2,
  Inbox,
  LayoutList,
  Link2,
  LoaderCircle,
  Menu,
  Monitor,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { extractHttpUrl } from "../lib/link-input";

type MaterialItem = {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  platform: string;
  author: string | null;
  thumbnail: string | null;
  category: string;
  tags: string[];
  notes: string;
  captureMethod: string;
  device: string;
  favorite: boolean;
  status: string;
  previewCheckedAt: string | null;
  createdAt: string;
};

type PatchMaterial = Partial<
  Pick<MaterialItem, "title" | "category" | "tags" | "notes" | "favorite">
>;

type MaterialCategory = {
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  createdAt: string;
};

const initialCategories: MaterialCategory[] = [
  {
    name: "灵感收集",
    color: "coral",
    position: 0,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  {
    name: "产品设计",
    color: "blue",
    position: 1,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  {
    name: "AI 学习",
    color: "purple",
    position: 2,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  {
    name: "文字创作",
    color: "amber",
    position: 3,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  {
    name: "视频创作",
    color: "pink",
    position: 4,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  {
    name: "知识学习",
    color: "green",
    position: 5,
    isDefault: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
];

const primaryScopes = [
  { id: "all", label: "所有素材", icon: Grid2X2 },
  { id: "inbox", label: "收件箱", icon: Inbox },
  { id: "favorites", label: "我的收藏", icon: Star },
  { id: "recent", label: "最近添加", icon: Clock3 },
];

const GENERAL_DEFAULT_COVER = "/default-cover.jpg";
const CATEGORY_DEFAULT_COVERS: Record<string, string> = {
  灵感收集: "/default-covers/inspiration.jpg",
  产品设计: "/default-covers/product.jpg",
  产品学习: "/default-covers/product.jpg",
  "AI 学习": "/default-covers/ai.jpg",
  AI学习: "/default-covers/ai.jpg",
  文字创作: "/default-covers/writing.jpg",
  视频创作: "/default-covers/video.jpg",
  视频学习: "/default-covers/video.jpg",
  知识学习: "/default-covers/learning.jpg",
};

function getDefaultCover(category: string) {
  return CATEGORY_DEFAULT_COVERS[category] ?? GENERAL_DEFAULT_COVER;
}

function formatDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return `今天 ${new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)}`;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function MaterialInbox() {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureCategory, setCaptureCategory] = useState("收件箱");
  const [captureTags, setCaptureTags] = useState("");
  const [adding, setAdding] = useState(false);
  const [categories, setCategories] =
    useState<MaterialCategory[]>(initialCategories);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [refreshingPreviewIds, setRefreshingPreviewIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const captureUrlRef = useRef<HTMLInputElement>(null);
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const refreshingPreviewIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: globalThis.KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (command && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setCaptureOpen(true);
        window.setTimeout(() => captureUrlRef.current?.focus(), 80);
      }
      if (event.key === "Escape") {
        setCaptureOpen(false);
        setSidebarOpen(false);
        setCategoryEditorOpen(false);
        setCategoryName("");
      }
    };
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      const value = event.clipboardData?.getData("text/plain").trim() ?? "";
      const extractedUrl = extractHttpUrl(value);
      if (extractedUrl) {
        event.preventDefault();
        setCaptureUrl(extractedUrl);
        setCaptureOpen(true);
        window.setTimeout(() => captureUrlRef.current?.focus(), 80);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyboard);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const categoryColors = useMemo(
    () =>
      Object.fromEntries([
        ["收件箱", "violet"],
        ...categories.map((category) => [category.name, category.color]),
      ]) as Record<string, string>,
    [categories],
  );

  const counts = useMemo(() => {
    return {
      all: items.length,
      inbox: items.filter((item) => item.category === "收件箱").length,
      favorites: items.filter((item) => item.favorite).length,
      recent: items.filter(
        (item) =>
          Date.now() - new Date(item.createdAt).getTime() <
          7 * 24 * 60 * 60 * 1000,
      ).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesScope =
        activeScope === "all" ||
        (activeScope === "inbox" && item.category === "收件箱") ||
        (activeScope === "favorites" && item.favorite) ||
        (activeScope === "recent" &&
          Date.now() - new Date(item.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000) ||
        item.category === activeScope;

      if (!matchesScope) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        item.title,
        item.platform,
        item.author,
        item.notes,
        item.category,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeScope, items, query]);

  const activeLabel =
    primaryScopes.find((scope) => scope.id === activeScope)?.label ??
    activeScope;

  async function loadItems() {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/items", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);
      const [itemsData, categoriesData] = await Promise.all([
        itemsResponse.json(),
        categoriesResponse.json(),
      ]);
      if (!itemsResponse.ok) throw new Error(itemsData.error);
      if (!categoriesResponse.ok) throw new Error(categoriesData.error);
      setItems(itemsData.items);
      setCategories(categoriesData.categories);
      setSelectedId((current) => current ?? itemsData.items[0]?.id ?? null);
      const previewsToRead = (itemsData.items as MaterialItem[])
        .filter((item) => !item.thumbnail && !item.previewCheckedAt)
        .slice(0, 4);
      window.setTimeout(() => {
        previewsToRead.forEach((item) => {
          void refreshPreview(item.id, true);
        });
      }, 120);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "素材加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function patchItem(id: string, patch: PatchMaterial) {
    const snapshot = items;
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    try {
      const response = await fetch("/api/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems((current) =>
        current.map((item) => (item.id === id ? data.item : item)),
      );
    } catch (error) {
      setItems(snapshot);
      setToast(error instanceof Error ? error.message : "保存失败");
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const extractedUrl = extractHttpUrl(captureUrl);
    if (!extractedUrl) {
      setToast("没有识别到链接，请粘贴网址或完整分享文案");
      captureUrlRef.current?.focus();
      return;
    }
    setAdding(true);
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: extractedUrl,
          title: captureTitle.trim(),
          category: captureCategory,
          tags: captureTags
            .split(/[,，、]/)
            .map((tag) => tag.trim())
            .filter(Boolean),
          captureMethod: "网页粘贴",
          device: "网页",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!data.duplicate) {
        setItems((current) => [data.item, ...current]);
      }
      setSelectedId(data.item.id);
      setInspectorOpen(true);
      setActiveScope("all");
      setCaptureUrl("");
      setCaptureTitle("");
      setCaptureTags("");
      setCaptureCategory("收件箱");
      setCaptureOpen(false);
      if (!data.item.thumbnail && !data.item.previewCheckedAt) {
        void refreshPreview(data.item.id, true);
      }
      setToast(
        data.duplicate
          ? "这条素材已经在库里了"
          : "素材已保存，正在读取链接预览",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "保存失败");
    } finally {
      setAdding(false);
    }
  }

  async function refreshPreview(id: string, silent = false) {
    if (refreshingPreviewIdsRef.current.has(id)) return;
    refreshingPreviewIdsRef.current.add(id);
    setRefreshingPreviewIds(new Set(refreshingPreviewIdsRef.current));

    try {
      const response = await fetch("/api/items/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems((current) =>
        current.map((item) => (item.id === id ? data.item : item)),
      );
      if (!silent) {
        setToast(
          data.found
            ? "预览图已更新"
            : "该网页没有公开预览图，已保留原链接",
        );
      }
    } catch (error) {
      if (!silent) {
        setToast(error instanceof Error ? error.message : "预览读取失败");
      }
    } finally {
      refreshingPreviewIdsRef.current.delete(id);
      setRefreshingPreviewIds(new Set(refreshingPreviewIdsRef.current));
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim().replace(/\s+/g, " ");
    if (!name) {
      setToast("请输入分类名称");
      categoryNameRef.current?.focus();
      return;
    }

    setAddingCategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories((current) =>
        [...current, data.category].sort(
          (first, second) => first.position - second.position,
        ),
      );
      setActiveScope(data.category.name);
      setCaptureCategory(data.category.name);
      setCategoryName("");
      setCategoryEditorOpen(false);
      setSidebarOpen(false);
      setToast(`已创建分类“${data.category.name}”`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "分类创建失败");
      categoryNameRef.current?.focus();
    } finally {
      setAddingCategory(false);
    }
  }

  async function removeItem(item: MaterialItem) {
    const confirmed = window.confirm(`确定删除“${item.title}”吗？`);
    if (!confirmed) return;
    try {
      const response = await fetch(
        `/api/items?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSelectedId(null);
      setInspectorOpen(false);
      setToast("素材已删除");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "删除失败");
    }
  }

  function selectScope(id: string) {
    setActiveScope(id);
    setSidebarOpen(false);
  }

  return (
    <div
      className={`app-shell ${inspectorOpen ? "" : "inspector-closed"}`}
    >
      <button
        className={`sidebar-scrim ${sidebarOpen ? "visible" : ""}`}
        aria-label="关闭分类导航"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <strong>拾集</strong>
            <small>个人灵感素材库</small>
          </div>
          <button
            className="sidebar-close icon-button"
            aria-label="关闭分类导航"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={17} />
          </button>
        </div>

        <nav className="sidebar-scroll" aria-label="素材库导航">
          <div className="nav-group">
            {primaryScopes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item ${activeScope === id ? "active" : ""}`}
                onClick={() => selectScope(id)}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{label}</span>
                <em>{counts[id as keyof typeof counts]}</em>
              </button>
            ))}
          </div>

          <div className="nav-section-heading">
            <span>分类</span>
            <button
              className={categoryEditorOpen ? "active" : ""}
              aria-label="新增分类"
              aria-expanded={categoryEditorOpen}
              onClick={() => {
                setCategoryEditorOpen(true);
                window.setTimeout(() => categoryNameRef.current?.focus(), 40);
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {categoryEditorOpen && (
            <form className="category-create" onSubmit={addCategory}>
              <input
                ref={categoryNameRef}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="输入分类名称"
                aria-label="分类名称"
                maxLength={12}
                autoComplete="off"
              />
              <button
                className="confirm"
                type="submit"
                aria-label="确认新增分类"
                disabled={addingCategory || !categoryName.trim()}
              >
                {addingCategory ? (
                  <LoaderCircle className="spin" size={14} />
                ) : (
                  <Check size={14} />
                )}
              </button>
              <button
                type="button"
                aria-label="取消新增分类"
                onClick={() => {
                  setCategoryEditorOpen(false);
                  setCategoryName("");
                }}
              >
                <X size={14} />
              </button>
            </form>
          )}

          <div className="nav-group category-nav">
            {categories.map((category) => (
              <button
                key={category.name}
                className={`nav-item ${activeScope === category.name ? "active" : ""}`}
                onClick={() => selectScope(category.name)}
              >
                <span
                  className={`category-dot ${category.color}`}
                  aria-hidden="true"
                />
                <span>{category.name}</span>
                <em>
                  {
                    items.filter((item) => item.category === category.name)
                      .length
                  }
                </em>
              </button>
            ))}
          </div>

          <div className="nav-section-heading">
            <span>常用标签</span>
            <button aria-label="管理标签">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="sidebar-tags">
            {["灵感", "待实践", "视觉风格", "工作流", "旅行"].map((tag) => (
              <button key={tag} onClick={() => setQuery(tag)}>
                <span>#</span>
                {tag}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sync-dot" />
          <span>云端已同步</span>
          <small>{items.length} 条素材</small>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="打开分类导航"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={19} />
          </button>

          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、标签、备注..."
              aria-label="搜索素材"
            />
            <kbd>⌘ K</kbd>
          </label>

          <div className="topbar-actions">
            <button
              className="primary-button"
              onClick={() => {
                setCaptureOpen(true);
                window.setTimeout(() => captureUrlRef.current?.focus(), 80);
              }}
            >
              <Plus size={16} />
              <span>添加素材</span>
            </button>
            <button className="avatar" aria-label="账户与设置">
              J
            </button>
          </div>
        </header>

        {captureOpen && (
          <section className="capture-tray" aria-label="添加新素材">
            <div className="capture-heading">
              <div className="capture-icon">
                <Link2 size={18} />
              </div>
              <div>
                <strong>把链接或分享文案放进素材库</strong>
                <p>支持社交平台分享文案与 Pinterest 等网页链接。</p>
              </div>
              <button
                className="icon-button"
                aria-label="关闭添加素材"
                onClick={() => setCaptureOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addItem} className="capture-form">
              <label className="field field-url">
                <span>素材链接或分享文案</span>
                <input
                  ref={captureUrlRef}
                  type="text"
                  inputMode="url"
                  value={captureUrl}
                  onChange={(event) => setCaptureUrl(event.target.value)}
                  onPaste={(event) => {
                    const pastedText = event.clipboardData.getData("text/plain");
                    const extractedUrl = extractHttpUrl(pastedText);
                    if (!extractedUrl) return;
                    event.preventDefault();
                    setCaptureUrl(extractedUrl);
                    if (pastedText.trim() !== extractedUrl) {
                      setToast("已从分享文案中识别出链接");
                    }
                  }}
                  placeholder="粘贴小红书、抖音、B站分享文案或 Pinterest 链接"
                  autoComplete="off"
                />
              </label>
              <label className="field">
                <span>标题（可选）</span>
                <input
                  value={captureTitle}
                  onChange={(event) => setCaptureTitle(event.target.value)}
                  placeholder="不填则使用来源生成"
                />
              </label>
              <label className="field">
                <span>分类</span>
                <span className="select-wrap">
                  <select
                    value={captureCategory}
                    onChange={(event) => setCaptureCategory(event.target.value)}
                  >
                    <option>收件箱</option>
                    <optgroup label="素材分类">
                      {categories.map((category) => (
                        <option key={category.name}>{category.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>
              <label className="field">
                <span>标签（可选）</span>
                <input
                  value={captureTags}
                  onChange={(event) => setCaptureTags(event.target.value)}
                  placeholder="用逗号分隔"
                />
              </label>
              <button
                className="save-button"
                type="submit"
                disabled={adding}
              >
                {adding ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Check size={17} />
                )}
                {adding ? "保存中" : "保存到收件箱"}
              </button>
            </form>
          </section>
        )}

        <section className="library-heading">
          <div>
            <div className="heading-line">
              <h1>{activeLabel}</h1>
              <span>{filteredItems.length}</span>
            </div>
            <p>
              {query
                ? `正在查找“${query}”`
                : activeScope === "inbox"
                  ? "先收进来，再慢慢整理。"
                  : "收集来自手机与电脑的每一条灵感。"}
            </p>
          </div>
          <div className="view-tools">
            <div className="segmented" aria-label="素材显示方式">
              <button
                className={view === "grid" ? "active" : ""}
                aria-label="卡片视图"
                onClick={() => setView("grid")}
              >
                <Grid2X2 size={16} />
              </button>
              <button
                className={view === "list" ? "active" : ""}
                aria-label="列表视图"
                onClick={() => setView("list")}
              >
                <LayoutList size={17} />
              </button>
            </div>
            <button
              className="inspector-toggle icon-button"
              aria-label={inspectorOpen ? "收起详情" : "显示详情"}
              onClick={() => setInspectorOpen((current) => !current)}
            >
              {inspectorOpen ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </button>
          </div>
        </section>

        <div className="library-scroll">
          {loading ? (
            <LoadingState />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              query={query}
              onAdd={() => {
                setQuery("");
                setCaptureOpen(true);
              }}
            />
          ) : view === "grid" ? (
            <div className="asset-grid">
              {filteredItems.map((item, index) => (
                <AssetCard
                  key={item.id}
                  item={item}
                  index={index}
                  categoryColor={categoryColors[item.category] || "violet"}
                  selected={selectedId === item.id}
                  onSelect={() => {
                    setSelectedId(item.id);
                    setInspectorOpen(true);
                  }}
                  onFavorite={() =>
                    patchItem(item.id, { favorite: !item.favorite })
                  }
                  refreshingPreview={refreshingPreviewIds.has(item.id)}
                  onRefreshPreview={() => void refreshPreview(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="asset-list">
              {filteredItems.map((item) => (
                <AssetRow
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  onSelect={() => {
                    setSelectedId(item.id);
                    setInspectorOpen(true);
                  }}
                  onFavorite={() =>
                    patchItem(item.id, { favorite: !item.favorite })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <button
        className={`detail-scrim ${inspectorOpen && selected ? "visible" : ""}`}
        aria-label="关闭素材详情"
        onClick={() => setInspectorOpen(false)}
      />

      <aside
        className={`inspector ${inspectorOpen && selected ? "open" : ""}`}
        aria-label="素材详情"
      >
        {selected ? (
          <Inspector
            key={selected.id}
            item={selected}
            categories={categories}
            categoryColors={categoryColors}
            refreshingPreview={refreshingPreviewIds.has(selected.id)}
            onClose={() => setInspectorOpen(false)}
            onPatch={(patch) => patchItem(selected.id, patch)}
            onDelete={() => removeItem(selected)}
            onRefreshPreview={() => void refreshPreview(selected.id)}
          />
        ) : (
          <div className="inspector-empty">
            <Bookmark size={24} />
            <strong>选择一条素材</strong>
            <p>这里会显示来源、分类、标签与备注。</p>
          </div>
        )}
      </aside>

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function AssetCard({
  item,
  index,
  categoryColor,
  selected,
  onSelect,
  onFavorite,
  refreshingPreview,
  onRefreshPreview,
}: {
  item: MaterialItem;
  index: number;
  categoryColor: string;
  selected: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  refreshingPreview: boolean;
  onRefreshPreview: () => void;
}) {
  return (
    <article
      className={`asset-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className={`asset-media ratio-${index % 3}`}>
        <PreviewVisual
          item={item}
          alt=""
          refreshing={refreshingPreview}
          onRefresh={onRefreshPreview}
        />
        <span className="card-category-badge">
          <span className={`category-dot ${categoryColor}`} />
          <span>{item.category}</span>
        </span>
        <span className="platform-badge">{item.platform}</span>
        <button
          className={`favorite-button ${item.favorite ? "active" : ""}`}
          aria-label={item.favorite ? "取消收藏" : "收藏素材"}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
        >
          <Star size={15} fill={item.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="asset-copy">
        <h2>{item.title}</h2>
        <div className="asset-meta">
          <span>{item.category}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="card-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function AssetRow({
  item,
  selected,
  onSelect,
  onFavorite,
}: {
  item: MaterialItem;
  selected: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}) {
  return (
    <article
      className={`asset-row ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="row-thumb">
        <PreviewVisual item={item} alt="" compact />
      </div>
      <div className="row-main">
        <strong>{item.title}</strong>
        <span>{item.author || getHostname(item.url)}</span>
      </div>
      <span className="row-category">{item.category}</span>
      <div className="row-tags">
        {item.tags.slice(0, 2).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <span className="row-date">{formatDate(item.createdAt)}</span>
      <button
        className={`row-favorite ${item.favorite ? "active" : ""}`}
        aria-label={item.favorite ? "取消收藏" : "收藏素材"}
        onClick={(event) => {
          event.stopPropagation();
          onFavorite();
        }}
      >
        <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

function PreviewVisual({
  item,
  alt,
  compact = false,
  priority = false,
  refreshing = false,
  onRefresh,
}: {
  item: MaterialItem;
  alt: string;
  compact?: boolean;
  priority?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.previewCheckedAt, item.thumbnail]);

  if (item.thumbnail && !imageFailed) {
    return (
      <img
        src={item.thumbnail}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <DefaultPreview
      alt={alt}
      category={item.category}
      compact={compact}
      refreshing={refreshing}
      previewChecked={Boolean(item.previewCheckedAt)}
      onRefresh={onRefresh}
    />
  );
}

function DefaultPreview({
  alt,
  category,
  compact = false,
  refreshing = false,
  previewChecked = false,
  onRefresh,
}: {
  alt: string;
  category: string;
  compact?: boolean;
  refreshing?: boolean;
  previewChecked?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className={`default-preview ${compact ? "compact" : ""}`}>
      <img src={getDefaultCover(category)} alt={alt} loading="lazy" />
      {!compact && onRefresh && (
        <button
          className="preview-read-button"
          type="button"
          aria-label="重新读取链接预览"
          disabled={refreshing}
          onClick={(event) => {
            event.stopPropagation();
            onRefresh();
          }}
        >
          <RefreshCw className={refreshing ? "spin" : ""} size={13} />
          {refreshing
            ? "读取中"
            : previewChecked
              ? "重试预览"
              : "读取预览"}
        </button>
      )}
    </div>
  );
}

function Inspector({
  item,
  categories,
  categoryColors,
  refreshingPreview,
  onClose,
  onPatch,
  onDelete,
  onRefreshPreview,
}: {
  item: MaterialItem;
  categories: MaterialCategory[];
  categoryColors: Record<string, string>;
  refreshingPreview: boolean;
  onClose: () => void;
  onPatch: (patch: PatchMaterial) => void;
  onDelete: () => void;
  onRefreshPreview: () => void;
}) {
  const [tagDraft, setTagDraft] = useState("");

  function addTag(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !tagDraft.trim()) return;
    event.preventDefault();
    onPatch({ tags: [...item.tags, tagDraft.trim()] });
    setTagDraft("");
  }

  return (
    <>
      <div className="inspector-header">
        <span>素材详情</span>
        <button className="icon-button" aria-label="关闭详情" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="inspector-scroll">
        <div className="inspector-preview">
          <PreviewVisual
            item={item}
            alt={item.title}
            priority
            refreshing={refreshingPreview}
            onRefresh={onRefreshPreview}
          />
        </div>

        <div className="inspector-actions">
          <button
            className={item.favorite ? "active" : ""}
            onClick={() => onPatch({ favorite: !item.favorite })}
          >
            <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
            {item.favorite ? "已收藏" : "收藏"}
          </button>
          <a href={item.url} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            打开来源
          </a>
        </div>

        <section className="inspector-section">
          <label className="detail-label" htmlFor={`title-${item.id}`}>
            标题
          </label>
          <textarea
            id={`title-${item.id}`}
            className="title-editor"
            defaultValue={item.title}
            rows={2}
            onBlur={(event) => {
              if (event.target.value.trim() !== item.title) {
                onPatch({ title: event.target.value });
              }
            }}
          />
        </section>

        <section className="inspector-section">
          <label className="detail-label" htmlFor={`category-${item.id}`}>
            分类
          </label>
          <div className="category-select">
            <span
              className={`category-dot ${categoryColors[item.category] || "violet"}`}
            />
            <select
              id={`category-${item.id}`}
              value={item.category}
              onChange={(event) => onPatch({ category: event.target.value })}
            >
              <option>收件箱</option>
              <optgroup label="素材分类">
                {categories.map((category) => (
                  <option key={category.name}>{category.name}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown size={15} />
          </div>
        </section>

        <section className="inspector-section">
          <label className="detail-label" htmlFor={`tags-${item.id}`}>
            标签
          </label>
          <div className="detail-tags">
            {item.tags.map((tag) => (
              <button
                key={tag}
                title="点击移除标签"
                onClick={() =>
                  onPatch({ tags: item.tags.filter((value) => value !== tag) })
                }
              >
                #{tag}
                <X size={12} />
              </button>
            ))}
            <input
              id={`tags-${item.id}`}
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={addTag}
              placeholder="+ 添加标签"
            />
          </div>
        </section>

        <section className="inspector-section">
          <label className="detail-label" htmlFor={`notes-${item.id}`}>
            我的备注
          </label>
          <textarea
            id={`notes-${item.id}`}
            className="notes-editor"
            defaultValue={item.notes}
            placeholder="记下为什么收藏，以及准备如何使用..."
            rows={5}
            onBlur={(event) => {
              if (event.target.value !== item.notes) {
                onPatch({ notes: event.target.value });
              }
            }}
          />
        </section>

        <section className="inspector-section source-section">
          <span className="detail-label">来源信息</span>
          <dl>
            <div>
              <dt>平台</dt>
              <dd>{item.platform}</dd>
            </div>
            <div>
              <dt>作者</dt>
              <dd>{item.author || "未识别"}</dd>
            </div>
            <div>
              <dt>采集方式</dt>
              <dd>
                {item.device.toLowerCase().includes("iphone") ? (
                  <Smartphone size={14} />
                ) : (
                  <Monitor size={14} />
                )}
                {item.captureMethod}
              </dd>
            </div>
            <div>
              <dt>保存时间</dt>
              <dd>{formatDate(item.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <button className="delete-button" onClick={onDelete}>
          <Trash2 size={15} />
          删除这条素材
        </button>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="asset-grid" aria-label="正在加载素材">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="loading-card" key={index}>
          <div />
          <span />
          <i />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  query,
  onAdd,
}: {
  query: string;
  onAdd: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">
        {query ? <Search size={25} /> : <Sparkles size={25} />}
      </div>
      <h2>{query ? "没有找到匹配的素材" : "这里还没有素材"}</h2>
      <p>
        {query
          ? "试试减少关键词，或者换一个分类查看。"
          : "粘贴一个链接，开始建立你的灵感素材库。"}
      </p>
      <button onClick={onAdd}>{query ? "清除搜索" : "添加第一条素材"}</button>
    </div>
  );
}
