-- Custom SQL migration file, put you code below! --

-- Rename old tables.
ALTER TABLE user RENAME TO old_user;
ALTER TABLE article RENAME TO old_article;
ALTER TABLE session RENAME TO old_session;

-- Create new tables to shorten the primary key of user, article.
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text NOT NULL,
	`github_id` integer
);

CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE no action
);

CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE no action
);

-- Copy data from old tables to new tables.
INSERT INTO user (id, created_at, updated_at, username, github_id)
SELECT SUBSTR(id, 1, 6), created_at, updated_at, username, github_id
FROM old_user;

INSERT INTO article (id, created_at, updated_at, user_id, title, content, content_type)
SELECT SUBSTR(id, 1, 6), created_at, updated_at, SUBSTR(user_id, 1, 6), title, content, content_type
FROM old_article;

INSERT INTO session (id, user_id, expires_at)
SELECT id, SUBSTR(user_id, 1, 6), expires_at
FROM old_session;

-- Drop old tables
DROP TABLE old_article;
DROP TABLE old_session;
DROP TABLE old_user;

-- Create new indexes.
CREATE UNIQUE INDEX `article_title_idx` ON `article` (`title`,`user_id`);
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);
