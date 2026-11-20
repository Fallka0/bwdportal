PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sol_progress` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	CONSTRAINT "sol_progress_status_check" CHECK("__new_sol_progress"."status" IN ('open','started','done'))
);
--> statement-breakpoint
INSERT INTO `__new_sol_progress`("task_id", "user_id", "status") SELECT "task_id", "user_id", "status" FROM `sol_progress`;--> statement-breakpoint
DROP TABLE `sol_progress`;--> statement-breakpoint
ALTER TABLE `__new_sol_progress` RENAME TO `sol_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;