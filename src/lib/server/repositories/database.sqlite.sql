CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	`path` text NOT NULL
);

CREATE UNIQUE INDEX `article_title_idx` ON `article` (`title`,`user_id`);
CREATE INDEX `article_user_id_idx` ON `article` (`user_id`);
CREATE INDEX `article_path_idx` ON `article` (`path`);
CREATE TABLE `bookmark` (
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer NOT NULL
);

CREATE INDEX `bookmark_user_id_idx` ON `bookmark` (`user_id`);
CREATE INDEX `bookmark_article_id_idx` ON `bookmark` (`article_id`);
CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`content` text NOT NULL
);

CREATE INDEX `comment_article_id_idx` ON `comment` (`article_id`);
CREATE INDEX `comment_user_id_idx` ON `comment` (`user_id`);
CREATE INDEX `comment_path_idx` ON `comment` (`path`);
CREATE TABLE `invite_code` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`role_key` text NOT NULL,
	`inviter_id` text NOT NULL,
	`used_at` integer
);

CREATE UNIQUE INDEX `invite_code_code_unique` ON `invite_code` (`code`);
CREATE INDEX `invite_code_inviter_id_idx` ON `invite_code` (`inviter_id`);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);

CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text NOT NULL,
	`github_id` integer,
	`name` text NOT NULL,
	`about_me` text NOT NULL
);

CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);
CREATE UNIQUE INDEX `user_name_unique` ON `user` (`name`);
CREATE TABLE `user_domain` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`verify_txt_record` text NOT NULL,
	`verified_at` integer
);

CREATE UNIQUE INDEX `user_domain_domain_unique` ON `user_domain` (`domain`);
CREATE INDEX `user_domain_user_id_idx` ON `user_domain` (`user_id`);
CREATE TABLE `user_role` (
	`user_id` text NOT NULL,
	`role_key` text NOT NULL,
	`invited_at` integer NOT NULL,
	`inviter_id` text,
	PRIMARY KEY(`user_id`, `role_key`)
);

CREATE INDEX `user_role_inviter_id_idx` ON `user_role` (`inviter_id`);
