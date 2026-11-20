CREATE TABLE `teacher_assignments` (
	`user_id` text NOT NULL,
	`class_id` text NOT NULL,
	`subject_code` text NOT NULL,
	PRIMARY KEY(`user_id`, `class_id`, `subject_code`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teacher_assignments_class` ON `teacher_assignments` (`class_id`);--> statement-breakpoint
ALTER TABLE `classes` ADD `class_teacher_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` text;