CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`class_id` text,
	`subject_code` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tests_class_date` ON `tests` (`class_id`,`date`);--> statement-breakpoint
CREATE INDEX `tests_owner` ON `tests` (`owner_id`);