CREATE TABLE `absence_lessons` (
	`absence_id` text NOT NULL,
	`period` integer NOT NULL,
	`subject_code` text,
	PRIMARY KEY(`absence_id`, `period`),
	FOREIGN KEY (`absence_id`) REFERENCES `absences`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `absences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`reason` text,
	`note` text,
	`due_date` text,
	`attachment_key` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "absences_status_check" CHECK("absences"."status" IN ('open','sent','excused','unexcused'))
);
--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`class_id` text NOT NULL,
	`subject_code` text NOT NULL,
	`teacher_code` text,
	PRIMARY KEY(`class_id`, `subject_code`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_code`) REFERENCES `subjects`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_code`) REFERENCES `teachers`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`program` text,
	`class_teacher` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classes_code_unique` ON `classes` (`code`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`grp` text NOT NULL,
	`title` text NOT NULL,
	`file_type` text NOT NULL,
	`size_bytes` integer,
	`note` text,
	`r2_key` text,
	`updated_at` text,
	`sort` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`subject_code` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`semester` integer NOT NULL,
	`class_average` real
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "grades_value_check" CHECK("grades"."value" BETWEEN 1 AND 6)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grades_exam_user` ON `grades` (`exam_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`ok` integer,
	`lessons` integer,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`subject_code` text,
	`teacher_code` text,
	`room` text,
	`state` text DEFAULT 'normal' NOT NULL,
	`original_room` text,
	`source` text DEFAULT 'mock' NOT NULL,
	`external_id` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_code`) REFERENCES `subjects`(`code`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lessons_state_check" CHECK("lessons"."state" IN ('normal','room_changed','cancelled','sol'))
);
--> statement-breakpoint
CREATE INDEX `lessons_class_date` ON `lessons` (`class_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_source_external` ON `lessons` (`source`,`external_id`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`grp` text NOT NULL,
	`title` text NOT NULL,
	`sub` text,
	`url` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`badge` text NOT NULL,
	`accent` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`teaser` text,
	`body_md` text,
	`author` text,
	`published_at` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`document_id` text
);
--> statement-breakpoint
CREATE TABLE `news_read` (
	`news_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`news_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`icon` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`href` text,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE TABLE `periods` (
	`n` integer PRIMARY KEY NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`n_timetable` integer DEFAULT true NOT NULL,
	`n_grades` integer DEFAULT true NOT NULL,
	`n_news` integer DEFAULT true NOT NULL,
	`n_absences` integer DEFAULT true NOT NULL,
	`n_email` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sol_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`n` integer NOT NULL,
	`starts` text,
	`ends` text
);
--> statement-breakpoint
CREATE TABLE `sol_days` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`block_id`) REFERENCES `sol_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sol_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sol_day_id` text NOT NULL,
	`task_id` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`note` text,
	FOREIGN KEY (`sol_day_id`) REFERENCES `sol_days`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `sol_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sol_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sol_day_id` text NOT NULL,
	`check_in` text,
	`check_out` text,
	`updated_at` text,
	FOREIGN KEY (`sol_day_id`) REFERENCES `sol_days`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sol_portfolio_user_day` ON `sol_portfolio` (`user_id`,`sol_day_id`);--> statement-breakpoint
CREATE TABLE `sol_presence` (
	`id` text PRIMARY KEY NOT NULL,
	`sol_day_id` text NOT NULL,
	`teacher_code` text NOT NULL,
	`subject_code` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`room` text,
	`lane` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`sol_day_id`) REFERENCES `sol_days`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sol_progress` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`percent` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	CONSTRAINT "sol_progress_percent_check" CHECK("sol_progress"."percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE `sol_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`subject_code` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`minutes` integer NOT NULL,
	`sharepoint_url` text,
	`r2_key` text,
	FOREIGN KEY (`block_id`) REFERENCES `sol_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`class_id` text,
	`role` text DEFAULT 'student' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);