CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`normalized_url` text NOT NULL,
	`title` text NOT NULL,
	`platform` text NOT NULL,
	`author` text,
	`thumbnail` text,
	`category` text DEFAULT '收件箱' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`capture_method` text DEFAULT '网页粘贴' NOT NULL,
	`device` text DEFAULT '网页' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'ready' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_normalized_url_unique` ON `items` (`normalized_url`);