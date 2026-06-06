CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
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
	CONSTRAINT `fk_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	`activeOrganizationSlug` text,
	`activeTeamId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sessions_activeOrganizationId_organizations_id_fk` FOREIGN KEY (`activeOrganizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sessions_activeTeamId_teams_id_fk` FOREIGN KEY (`activeTeamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`firstName` text NOT NULL,
	`lastName` text,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`licenseNumber` text,
	`defaultAppointmentDuration` integer DEFAULT 30,
	`appointmentGapMinutes` integer DEFAULT 5,
	`slotIncrementMinutes` integer DEFAULT 15,
	`specialization` text DEFAULT '[]',
	`phoneNumbers` text DEFAULT '[]',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `availability_exceptions` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`date` text NOT NULL,
	`startTime` text,
	`endTime` text,
	`isAvailable` integer NOT NULL,
	`reason` text,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_availability_exceptions_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_availability_exceptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `weekly_availability_templates` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`dayOfWeek` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`location` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_weekly_availability_templates_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_weekly_availability_templates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`treatmentPlanId` text,
	`therapistId` text NOT NULL,
	`roomId` text,
	`date` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`duration` integer NOT NULL,
	`type` text,
	`location` text DEFAULT 'clinic' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`confirmedAt` integer,
	`cancelledAt` integer,
	`noShowReason` text,
	`cancellationReason` text,
	`primaryConcern` text,
	`observations` text,
	`sessionNotes` text,
	`painLevelBefore` integer,
	`painLevelAfter` integer,
	`actualStartTime` text,
	`actualDurationSeconds` integer,
	`totalPausedSeconds` integer,
	`pauseStartTime` text,
	`extendedDurationMinutes` integer DEFAULT 0,
	`tags` text,
	`priceCents` integer DEFAULT 0 NOT NULL,
	`isLocked` integer DEFAULT false,
	`lockedAt` integer,
	`lockedById` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_appointments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_appointments_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_appointments_treatmentPlanId_treatment_plans_id_fk` FOREIGN KEY (`treatmentPlanId`) REFERENCES `treatment_plans`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_appointments_therapistId_users_id_fk` FOREIGN KEY (`therapistId`) REFERENCES `users`(`id`),
	CONSTRAINT `fk_appointments_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_appointments_lockedById_users_id_fk` FOREIGN KEY (`lockedById`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_documents` (
	`id` text PRIMARY KEY,
	`patientId` text NOT NULL,
	`organizationId` text NOT NULL,
	`uploadedById` text NOT NULL,
	`treatmentPlanId` text,
	`fileName` text NOT NULL,
	`originalFileName` text NOT NULL,
	`mimeType` text NOT NULL,
	`fileSize` integer NOT NULL,
	`storageKey` text NOT NULL UNIQUE,
	`category` text NOT NULL,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_patient_documents_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_patient_documents_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_patient_documents_uploadedById_users_id_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`),
	CONSTRAINT `fk_patient_documents_treatmentPlanId_treatment_plans_id_fk` FOREIGN KEY (`treatmentPlanId`) REFERENCES `treatment_plans`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL,
	`inviterId` text NOT NULL,
	`organizationId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`teamId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_invitations_inviterId_users_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_invitations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_members_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`logo` text,
	`type` text,
	`description` text,
	`status` text DEFAULT 'active',
	`timezone` text DEFAULT 'Africa/Casablanca',
	`contact` text NOT NULL,
	`address` text NOT NULL,
	`pricing` text NOT NULL,
	`legalRepresentative` text,
	`fiscal` text,
	`banking` text,
	`scheduling` text,
	`clinical` text,
	`notifications` text,
	`intake` text,
	`branding` text,
	`metadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_team_members_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`organizationId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_teams_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`sex` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`address` text,
	`city` text,
	`postalCode` text,
	`country` text,
	`emergencyContacts` text DEFAULT '[]' NOT NULL,
	`medicalConditions` text NOT NULL,
	`surgeries` text NOT NULL,
	`allergies` text NOT NULL,
	`medications` text NOT NULL,
	`insuranceProvider` text,
	`insuranceNumber` text,
	`referralSource` text,
	`notes` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	CONSTRAINT `fk_patients_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `appointment_payment_items` (
	`id` text PRIMARY KEY,
	`paymentId` text NOT NULL,
	`appointmentId` text NOT NULL,
	`amountCents` integer NOT NULL,
	CONSTRAINT `fk_appointment_payment_items_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`recordedById` text NOT NULL,
	`amountCents` integer NOT NULL,
	`currency` text DEFAULT 'MAD',
	`type` text NOT NULL,
	`method` text NOT NULL,
	`receiptNumber` text NOT NULL UNIQUE,
	`notes` text,
	`paidOn` text NOT NULL,
	`voidedAt` integer,
	`voidedById` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_payments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_payments_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_payments_recordedById_users_id_fk` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`),
	CONSTRAINT `fk_payments_voidedById_users_id_fk` FOREIGN KEY (`voidedById`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`equipment` text DEFAULT '[]',
	`capacity` integer DEFAULT 1 NOT NULL,
	`area` integer,
	`prm` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	CONSTRAINT `fk_rooms_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `treatment_plans` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`therapistId` text NOT NULL,
	`title` text NOT NULL,
	`diagnosis` text NOT NULL,
	`objective` text,
	`startDate` text NOT NULL,
	`endDate` text,
	`numberOfSessions` integer,
	`sessionFrequency` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`prescribingDoctor` text,
	`prescriptionDate` text NOT NULL,
	`coverageStatus` text,
	`insuranceInfo` text,
	`pricing` text NOT NULL,
	`notes` text DEFAULT '[]',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_treatment_plans_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_treatment_plans_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_treatment_plans_therapistId_users_id_fk` FOREIGN KEY (`therapistId`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exceptions_unique` ON `availability_exceptions` (`organizationId`,`userId`,`date`,`startTime`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user` ON `availability_exceptions` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user_date` ON `availability_exceptions` (`organizationId`,`userId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_user_date_range` ON `availability_exceptions` (`organizationId`,`userId`,`date`,`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_org_date` ON `availability_exceptions` (`organizationId`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weekly_templates_unique` ON `weekly_availability_templates` (`organizationId`,`userId`,`dayOfWeek`,`startTime`,`endTime`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_user` ON `weekly_availability_templates` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_user_day` ON `weekly_availability_templates` (`organizationId`,`userId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `idx_weekly_templates_org_location` ON `weekly_availability_templates` (`organizationId`,`location`);--> statement-breakpoint
CREATE INDEX `idx_appointments_cursor` ON `appointments` (`organizationId`,`date`,`id`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_patient_date` ON `appointments` (`organizationId`,`patientId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_date` ON `appointments` (`organizationId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_status_date` ON `appointments` (`organizationId`,`status`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_therapist_date` ON `appointments` (`organizationId`,`therapistId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_location_date` ON `appointments` (`organizationId`,`location`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_org_therapist_date_status` ON `appointments` (`organizationId`,`therapistId`,`date`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_appointments_room_booking_unique` ON `appointments` (`roomId`,`date`,`startTime`);--> statement-breakpoint
CREATE INDEX `idx_appointments_room_date` ON `appointments` (`roomId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_appointments_room_date_time` ON `appointments` (`roomId`,`date`,`startTime`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_patient` ON `patient_documents` (`organizationId`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_uploaded_at` ON `patient_documents` (`organizationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_patient_treatment_plan` ON `patient_documents` (`organizationId`,`patientId`,`treatmentPlanId`);--> statement-breakpoint
CREATE INDEX `idx_patient_documents_org_active_uploader` ON `patient_documents` (`organizationId`,`uploadedById`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_first_name` ON `patients` (`organizationId`,`deletedAt`,`firstName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_last_name` ON `patients` (`organizationId`,`deletedAt`,`lastName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_email` ON `patients` (`organizationId`,`deletedAt`,`email`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_phone` ON `patients` (`organizationId`,`deletedAt`,`phone`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_created_at` ON `patients` (`organizationId`,`deletedAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_active_name_search` ON `patients` (`organizationId`,`deletedAt`,`lastName`,`firstName`);--> statement-breakpoint
CREATE INDEX `idx_patients_org_deleted_only` ON `patients` (`organizationId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `idx_appointment_payment_items_payment` ON `appointment_payment_items` (`paymentId`);--> statement-breakpoint
CREATE INDEX `idx_appointment_payment_items_appointment` ON `appointment_payment_items` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `idx_payments_org_patient_date` ON `payments` (`organizationId`,`patientId`,`paidOn`);--> statement-breakpoint
CREATE INDEX `idx_payments_org_type` ON `payments` (`organizationId`,`type`);--> statement-breakpoint
CREATE INDEX `idx_payments_voided` ON `payments` (`voidedAt`);--> statement-breakpoint
CREATE INDEX `idx_rooms_org_name` ON `rooms` (`organizationId`,`deletedAt`,`name`);--> statement-breakpoint
CREATE INDEX `idx_rooms_org_created` ON `rooms` (`organizationId`,`deletedAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_rooms_org_deleted` ON `rooms` (`organizationId`,`deletedAt`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_patient` ON `treatment_plans` (`organizationId`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_status` ON `treatment_plans` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_therapist` ON `treatment_plans` (`organizationId`,`therapistId`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_start_date` ON `treatment_plans` (`organizationId`,`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_org_active_therapist_status` ON `treatment_plans` (`organizationId`,`therapistId`,`status`);