CREATE TABLE `patient_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`organizationId` text NOT NULL,
	`fileName` text NOT NULL,
	`originalName` text NOT NULL,
	`mimeType` text NOT NULL,
	`fileSize` integer NOT NULL,
	`storageKey` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`uploadedBy` text NOT NULL,
	`createdAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patient_documents_storageKey_unique` ON `patient_documents` (`storageKey`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`dateOfBirth` integer,
	`gender` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`postalCode` text,
	`country` text,
	`emergencyContactName` text,
	`emergencyContactPhone` text,
	`emergencyContactRelationship` text,
	`medicalHistory` text,
	`medications` text,
	`allergies` text,
	`insuranceProvider` text,
	`insuranceNumber` text,
	`referralSource` text,
	`referralDate` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_email_unique` ON `patients` (`email`);