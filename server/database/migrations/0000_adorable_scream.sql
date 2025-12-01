CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	`activeTeamId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activeOrganizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activeTeamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`inviterId` text NOT NULL,
	`organizationId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`teamId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`metadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organizationId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`treatmentPlanId` text,
	`date` integer NOT NULL,
	`startTime` text,
	`endTime` text,
	`duration` integer,
	`type` text,
	`chiefComplaint` text,
	`notes` text,
	`treatmentSummary` text,
	`observations` text,
	`nextSteps` text,
	`painLevelBefore` integer,
	`painLevelAfter` integer,
	`progressNotes` text,
	`therapistId` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`location` text DEFAULT 'clinic',
	`billed` integer DEFAULT false,
	`insuranceClaimed` integer DEFAULT false,
	`cost` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`treatmentPlanId`) REFERENCES `treatment_plans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`therapistId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_consultations_org_patient_date` ON `consultations` (`organizationId`,`patientId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_date` ON `consultations` (`organizationId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_created_at` ON `consultations` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_status_date` ON `consultations` (`organizationId`,`status`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_therapist_date` ON `consultations` (`organizationId`,`therapistId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_session_type_date` ON `consultations` (`organizationId`,`type`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_location_date` ON `consultations` (`organizationId`,`location`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_billed_date` ON `consultations` (`organizationId`,`billed`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_insurance_date` ON `consultations` (`organizationId`,`insuranceClaimed`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_patient_date` ON `consultations` (`patientId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_date_patient` ON `consultations` (`organizationId`,`date`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_plan_date` ON `consultations` (`organizationId`,`treatmentPlanId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_therapist_date_status` ON `consultations` (`organizationId`,`therapistId`,`date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_consultations_org_patient_plan_date` ON `consultations` (`organizationId`,`patientId`,`treatmentPlanId`,`date`);--> statement-breakpoint
CREATE TABLE `patient_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`organizationId` text NOT NULL,
	`uploadedById` text NOT NULL,
	`treatmentPlanId` text,
	`fileName` text NOT NULL,
	`originalFileName` text NOT NULL,
	`mimeType` text NOT NULL,
	`fileSize` integer NOT NULL,
	`storageKey` text NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`treatmentPlanId`) REFERENCES `treatment_plans`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patient_documents_storageKey_unique` ON `patient_documents` (`storageKey`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_patient` ON `patient_documents` (`organizationId`,`deletedAt`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_category` ON `patient_documents` (`organizationId`,`deletedAt`,`category`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_uploaded_at` ON `patient_documents` (`organizationId`,`deletedAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_patient_category` ON `patient_documents` (`organizationId`,`deletedAt`,`patientId`,`category`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_category_uploaded` ON `patient_documents` (`organizationId`,`deletedAt`,`category`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_uploader` ON `patient_documents` (`organizationId`,`deletedAt`,`uploadedById`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_deleted_at` ON `patient_documents` (`organizationId`,`deletedAt`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`dateOfBirth` integer NOT NULL,
	`gender` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`address` text,
	`city` text,
	`postalCode` text,
	`country` text,
	`emergencyContacts` text,
	`medicalConditions` text,
	`surgeries` text,
	`allergies` text,
	`medications` text,
	`insuranceProvider` text,
	`insuranceNumber` text,
	`referralSource` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_first_name` ON `patients` (`organizationId`,`deletedAt`,`firstName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_last_name` ON `patients` (`organizationId`,`deletedAt`,`lastName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_email` ON `patients` (`organizationId`,`deletedAt`,`email`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_phone` ON `patients` (`organizationId`,`deletedAt`,`phone`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_status` ON `patients` (`organizationId`,`deletedAt`,`status`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_created_at` ON `patients` (`organizationId`,`deletedAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_name_search` ON `patients` (`organizationId`,`deletedAt`,`lastName`,`firstName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_status_created` ON `patients` (`organizationId`,`deletedAt`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_deleted_only` ON `patients` (`organizationId`,`deletedAt`);--> statement-breakpoint
CREATE TABLE `treatment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`therapistId` text NOT NULL,
	`title` text NOT NULL,
	`diagnosis` text NOT NULL,
	`objective` text,
	`startDate` integer NOT NULL,
	`endDate` integer,
	`numberOfSessions` integer,
	`sessionFrequency` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`prescribingDoctor` text,
	`prescriptionDate` integer,
	`painLevel` integer,
	`coverageStatus` text,
	`insuranceInfo` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`therapistId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_patient` ON `treatment_plans` (`organizationId`,`deletedAt`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_status` ON `treatment_plans` (`organizationId`,`deletedAt`,`status`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_therapist` ON `treatment_plans` (`organizationId`,`deletedAt`,`therapistId`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_prescribing_doctor` ON `treatment_plans` (`organizationId`,`deletedAt`,`prescribingDoctor`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_start_date` ON `treatment_plans` (`organizationId`,`deletedAt`,`startDate`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_end_date` ON `treatment_plans` (`organizationId`,`deletedAt`,`endDate`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_therapist_status` ON `treatment_plans` (`organizationId`,`deletedAt`,`therapistId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_prescribing_doctor_date` ON `treatment_plans` (`organizationId`,`deletedAt`,`prescribingDoctor`,`prescriptionDate`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_coverage_created` ON `treatment_plans` (`organizationId`,`deletedAt`,`coverageStatus`,`createdAt`);