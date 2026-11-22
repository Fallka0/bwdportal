CREATE TABLE `assessment_grades` (
	`assessment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` real NOT NULL,
	`entered_at` text NOT NULL,
	PRIMARY KEY(`assessment_id`, `user_id`),
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "assessment_grades_value_check" CHECK("assessment_grades"."value" BETWEEN 1 AND 6)
);
--> statement-breakpoint
CREATE INDEX `assessment_grades_user` ON `assessment_grades` (`user_id`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`subject_code` text NOT NULL,
	`semester` integer NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "assessments_semester_check" CHECK("assessments"."semester" BETWEEN 1 AND 6)
);
--> statement-breakpoint
CREATE INDEX `assessments_class_subject` ON `assessments` (`class_id`,`subject_code`,`semester`);