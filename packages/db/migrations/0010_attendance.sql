CREATE TABLE `attendance_checks` (
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`subject_code` text NOT NULL,
	`recorded_by` text NOT NULL,
	`recorded_at` text NOT NULL,
	`absent` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`class_id`, `date`, `start_time`, `subject_code`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `absence_lessons` ADD `recorded_by` text;--> statement-breakpoint
ALTER TABLE `absence_lessons` ADD `recorded_at` text;