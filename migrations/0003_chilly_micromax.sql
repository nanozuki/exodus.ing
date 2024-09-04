-- Custom SQL migration file, put you code below! --

PRAGMA foreign_keys = false;--> statement-breakpoint
PRAGMA defer_foreign_keys = ON;--> statement-breakpoint

CREATE TABLE `user_new` (
    `id` text PRIMARY KEY NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    `username` text NOT NULL,
    `github_id` integer,
    `name` text NOT NULL,
    `about_me` text NOT NULL
);--> statement-breakpoint

INSERT INTO `user_new` (id, created_at, updated_at, username, github_id, name, about_me)
SELECT id, created_at, updated_at, username, github_id, username AS name, COALESCE(about_me, '') AS about_me
FROM `user`;--> statement-breakpoint

DROP TABLE `user`;--> statement-breakpoint

ALTER TABLE `user_new` RENAME TO `user`;--> statement-breakpoint


CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);--> statement-breakpoint

PRAGMA foreign_keys = true;--> statement-breakpoint
PRAGMA defer_foreign_keys = OFF;--> statement-breakpoint
