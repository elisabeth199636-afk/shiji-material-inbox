# 拾集设计规范

## Visual Direction

使用者在白天的电脑桌前连续浏览大量素材，需要像专业样片台一样安静、准确。界面以冷静的中性灰和深石墨侧栏为基底，紫罗兰只用于当前状态和主要操作。

## Color Strategy

Restrained product palette，全部使用 OKLCH。

```css
:root {
  --bg: oklch(0.97 0.006 270);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.945 0.008 270);
  --ink: oklch(0.19 0.025 270);
  --muted: oklch(0.47 0.025 270);
  --line: oklch(0.88 0.012 270);
  --primary: oklch(0.445 0.206 279.1);
  --primary-soft: oklch(0.93 0.04 279);
}
```

## Layout

- Desktop: 232px sidebar + fluid asset workspace + 330px inspector.
- Tablet: collapsible sidebar and overlay inspector.
- Mobile: toolbar, two-column material grid, off-canvas navigation and full-width inspector.

## Typography

Use the Chinese system sans stack. Keep labels compact and avoid display typography inside the tool.
