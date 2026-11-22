CREATE TABLE `class_files` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`subject_code` text,
	`post_id` text,
	`name` text NOT NULL,
	`ext` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`r2_key` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `class_posts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `class_files_class` ON `class_files` (`class_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `class_files_post` ON `class_files` (`post_id`);--> statement-breakpoint
CREATE TABLE `class_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`subject_code` text,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `class_posts_class_created` ON `class_posts` (`class_id`,`created_at`);