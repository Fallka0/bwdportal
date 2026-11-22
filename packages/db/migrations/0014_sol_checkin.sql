CREATE TABLE `sol_checkin_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`sol_day_id` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sol_day_id`) REFERENCES `sol_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sol_checkin_codes_expires` ON `sol_checkin_codes` (`expires_at`);