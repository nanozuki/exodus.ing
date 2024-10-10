CREATE TABLE `bookmark` (
	`user_id` text NOT NULL,
	`article_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`content` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `article` ADD `path` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `article` SET `path` = `id` || '/';--> statement-breakpoint
CREATE INDEX `bookmark_user_id_idx` ON `bookmark` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookmark_article_id_idx` ON `bookmark` (`article_id`);--> statement-breakpoint
CREATE INDEX `comment_article_id_idx` ON `comment` (`article_id`);--> statement-breakpoint
CREATE INDEX `comment_user_id_idx` ON `comment` (`user_id`);--> statement-breakpoint
CREATE INDEX `comment_path_idx` ON `comment` (`path`);--> statement-breakpoint
CREATE INDEX `article_path_idx` ON `article` (`path`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);
