CREATE TABLE `availability_exceptions` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`date` integer NOT NULL,
	`startTime` text,
	`endTime` text,
	`isAvailable` integer NOT NULL,
	`reason` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_exceptions_unique` ON `availability_exceptions` (`organizationId`,`userId`,`date`,`startTime`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user` ON `availability_exceptions` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user_date` ON `availability_exceptions` (`organizationId`,`userId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user_date_range` ON `availability_exceptions` (`organizationId`,`userId`,`date`,`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_date` ON `availability_exceptions` (`organizationId`,`date`);
--> statement-breakpoint
CREATE TABLE `weekly_availability_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`dayOfWeek` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`location` text NOT NULL,
	`maxSessions` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_unique` ON `weekly_availability_templates` (`organizationId`,`userId`,`dayOfWeek`,`startTime`,`endTime`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_user` ON `weekly_availability_templates` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_user_day` ON `weekly_availability_templates` (`organizationId`,`userId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_location` ON `weekly_availability_templates` (`organizationId`,`location`);
