# 拾集设计规范

## Visual Direction

使用者在白天的电脑桌前连续浏览大量素材，需要像专业样片台一样安静、准确。界面以纯白、黑色与中性灰建立清晰层级，明亮黄色用于当前状态和主要操作；分类色点、同步状态与危险操作保留必要的功能色。

## Color Strategy

Restrained product palette，全部使用 OKLCH。

```css
:root {
  --bg: oklch(0.97 0 0);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.95 0 0);
  --ink: oklch(0.16 0 0);
  --muted: oklch(0.44 0 0);
  --line: oklch(0.87 0 0);
  --primary: oklch(0.9608 0.159 106.74);
  --primary-soft: oklch(0.9856 0.0278 98.05);
  --primary-contrast: oklch(0.14 0 0);
}
```

## Layout

- Desktop: 232px sidebar + fluid asset workspace + 330px inspector.
- Tablet: collapsible sidebar and overlay inspector.
- Mobile: toolbar, two-column material grid, off-canvas navigation and full-width inspector.

## Typography

Use the Chinese system sans stack. Keep labels compact and avoid display typography inside the tool.
