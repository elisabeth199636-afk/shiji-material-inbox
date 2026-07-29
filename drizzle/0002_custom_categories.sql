CREATE TABLE `categories` (
	`name` text PRIMARY KEY NOT NULL,
	`color` text DEFAULT 'cyan' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `categories`
  (`name`, `color`, `position`, `is_default`, `created_at`)
VALUES
  ('灵感收集', 'coral', 0, 1, '2026-07-29T00:00:00.000Z'),
  ('产品设计', 'blue', 1, 1, '2026-07-29T00:00:00.000Z'),
  ('AI 学习', 'purple', 2, 1, '2026-07-29T00:00:00.000Z'),
  ('文字创作', 'amber', 3, 1, '2026-07-29T00:00:00.000Z'),
  ('视频创作', 'pink', 4, 1, '2026-07-29T00:00:00.000Z'),
  ('知识学习', 'green', 5, 1, '2026-07-29T00:00:00.000Z');
