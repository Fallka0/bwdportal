ALTER TABLE `documents` ADD `class_id` text REFERENCES classes(id);--> statement-breakpoint
ALTER TABLE `news` ADD `class_id` text REFERENCES classes(id);--> statement-breakpoint
-- Bisherige Mitteilungen und Dokumente sind die erfundenen Beispieldaten: nur für die Demo-Klasse
UPDATE `news` SET `class_id` = 'c-im24b' WHERE `class_id` IS NULL AND EXISTS (SELECT 1 FROM `classes` WHERE `id` = 'c-im24b');--> statement-breakpoint
UPDATE `documents` SET `class_id` = 'c-im24b' WHERE `class_id` IS NULL AND EXISTS (SELECT 1 FROM `classes` WHERE `id` = 'c-im24b');
