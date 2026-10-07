CREATE TABLE `preview_rate_limits` (
	`user_id` text NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `window_started_at`)
);
