DROP INDEX `items_normalized_url_unique`;--> statement-breakpoint
ALTER TABLE `items` ADD `user_id` text DEFAULT '__legacy_owner__' NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS `items_created_at_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `items_category_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `items_user_normalized_url_unique` ON `items` (`user_id`,`normalized_url`);--> statement-breakpoint
CREATE INDEX `items_user_created_at_idx` ON `items` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `items_user_category_idx` ON `items` (`user_id`,`category`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`user_id` text DEFAULT '__legacy_owner__' NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'cyan' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `name`)
);
--> statement-breakpoint
INSERT INTO `__new_categories`("user_id", "name", "color", "position", "is_default", "created_at") SELECT '__legacy_owner__', "name", "color", "position", "is_default", "created_at" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `categories_user_position_idx` ON `categories` (`user_id`,`position`);
