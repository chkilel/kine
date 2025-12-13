ALTER TABLE `users` ADD `specialization` text;--> statement-breakpoint
ALTER TABLE `users` ADD `licenseNumber` text;--> statement-breakpoint
ALTER TABLE `users` ADD `defaultSessionDuration` integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumbers` text DEFAULT '[]';
