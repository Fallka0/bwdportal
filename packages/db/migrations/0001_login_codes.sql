CREATE TABLE `login_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
