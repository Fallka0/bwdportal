CREATE TABLE `absence_notices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`from_period` integer NOT NULL,
	`to_period` integer NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "absence_notices_periods_check" CHECK("absence_notices"."from_period" <= "absence_notices"."to_period")
);
--> statement-breakpoint
CREATE INDEX `absence_notices_user_date` ON `absence_notices` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `dispensation_lessons` (
	`dispensation_id` text NOT NULL,
	`period` integer NOT NULL,
	`subject_code` text,
	PRIMARY KEY(`dispensation_id`, `period`),
	FOREIGN KEY (`dispensation_id`) REFERENCES `dispensations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dispensations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`attachment_key` text,
	`attachment_key2` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dispensations_status_check" CHECK("dispensations"."status" IN ('submitted','approved','rejected'))
);
--> statement-breakpoint
CREATE INDEX `dispensations_user_date` ON `dispensations` (`user_id`,`date`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_absences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_absences`("id", "user_id", "date", "created_at") SELECT "id", "user_id", "date", "created_at" FROM `absences`;--> statement-breakpoint
DROP TABLE `absences`;--> statement-breakpoint
ALTER TABLE `__new_absences` RENAME TO `absences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `absences_user_date` ON `absences` (`user_id`,`date`);