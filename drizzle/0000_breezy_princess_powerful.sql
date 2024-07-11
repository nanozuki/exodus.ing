CREATE TABLE `article` (
	`id` blob PRIMARY KEY NOT NULL,
	`user_id` blob,
	`site_id` blob,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `site`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site` (
	`id` blob PRIMARY KEY NOT NULL,
	`user_id` blob,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` blob PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_title_idx` ON `article` (`title`,`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_name_unique` ON `site` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);