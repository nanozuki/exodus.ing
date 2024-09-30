CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invite_code` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`valid_from` integer NOT NULL,
	`valid_to` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text NOT NULL,
	`github_id` integer,
	`name` text NOT NULL,
	`about_me` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_domain` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`verify_txt_record` text NOT NULL,
	`verified_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_title_idx` ON `article` (`title`,`user_id`);--> statement-breakpoint
CREATE INDEX `article_user_id_idx` ON `article` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invite_code_code_unique` ON `invite_code` (`code`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_domain_domain_unique` ON `user_domain` (`domain`);--> statement-breakpoint
CREATE INDEX `user_domain_user_id_idx` ON `user_domain` (`user_id`);