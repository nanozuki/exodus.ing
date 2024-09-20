CREATE TABLE `user_domain` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`verify_txt_record` text NOT NULL,
	`verified_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_domain_domain_unique` ON `user_domain` (`domain`);--> statement-breakpoint
