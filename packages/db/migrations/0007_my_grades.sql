CREATE TABLE `my_efz` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`place` text NOT NULL,
	`module` text NOT NULL,
	`name` text NOT NULL,
	`value` real,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "my_efz_place_check" CHECK("my_efz"."place" IN ('gibb','uek'))
);
--> statement-breakpoint
CREATE INDEX `my_efz_user` ON `my_efz` (`user_id`);--> statement-breakpoint
CREATE TABLE `my_grades` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`semester` integer NOT NULL,
	`subject` text NOT NULL,
	`module` text,
	`module_name` text,
	`title` text NOT NULL,
	`value` real NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`date` text,
	`entered_at` text NOT NULL,
	`class_average` real,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "my_grades_value_check" CHECK("my_grades"."value" BETWEEN 1 AND 6),
	CONSTRAINT "my_grades_semester_check" CHECK("my_grades"."semester" BETWEEN 1 AND 6)
);
--> statement-breakpoint
CREATE INDEX `my_grades_user_semester` ON `my_grades` (`user_id`,`semester`);