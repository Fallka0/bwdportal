CREATE TABLE `sol_task_files` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`ext` text NOT NULL,
	`key` text NOT NULL,
	`pdf_key` text,
	`bytes` integer DEFAULT 0 NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `sol_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "sol_task_files_kind_check" CHECK("sol_task_files"."kind" IN ('task','material','solution'))
);
--> statement-breakpoint
CREATE INDEX `sol_task_files_task` ON `sol_task_files` (`task_id`);--> statement-breakpoint
ALTER TABLE `sol_progress` ADD `status` text DEFAULT 'open' NOT NULL;--> statement-breakpoint
UPDATE `sol_progress` SET `status` = CASE WHEN `percent` >= 100 THEN 'done' WHEN `percent` > 0 THEN 'started' ELSE 'open' END;
