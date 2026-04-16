CREATE TABLE `credit_note_allocations` (
	`id` text PRIMARY KEY,
	`creditNoteId` text NOT NULL,
	`invoiceId` text NOT NULL,
	`amountCents` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_credit_note_allocations_creditNoteId_credit_notes_id_fk` FOREIGN KEY (`creditNoteId`) REFERENCES `credit_notes`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `credit_notes` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`patientId` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`amountCents` integer NOT NULL,
	`reason` text NOT NULL,
	`referenceNumber` text NOT NULL,
	`notes` text,
	`issuedAt` integer,
	`issuedById` text,
	`cancelledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_credit_notes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_credit_notes_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_credit_notes_issuedById_users_id_fk` FOREIGN KEY (`issuedById`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_allocations` (
	`id` text PRIMARY KEY,
	`paymentId` text NOT NULL,
	`invoiceId` text,
	`appointmentId` text,
	`portion` text DEFAULT 'full' NOT NULL,
	`amountCents` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_payment_allocations_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `payerType` text DEFAULT 'patient';--> statement-breakpoint
ALTER TABLE `payments` ADD `payerInsuranceCompanyId` text REFERENCES insurance_companies(id);--> statement-breakpoint
CREATE INDEX `idx_credit_note_allocations_credit_note` ON `credit_note_allocations` (`creditNoteId`);--> statement-breakpoint
CREATE INDEX `idx_credit_note_allocations_invoice` ON `credit_note_allocations` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `idx_credit_notes_org_patient` ON `credit_notes` (`organizationId`,`patientId`);--> statement-breakpoint
CREATE INDEX `idx_credit_notes_org_status` ON `credit_notes` (`organizationId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_credit_notes_reference` ON `credit_notes` (`referenceNumber`);--> statement-breakpoint
CREATE INDEX `idx_payment_allocations_payment` ON `payment_allocations` (`paymentId`);--> statement-breakpoint
CREATE INDEX `idx_payment_allocations_invoice` ON `payment_allocations` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `idx_payment_allocations_appointment` ON `payment_allocations` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `idx_payments_payer_insurance` ON `payments` (`payerInsuranceCompanyId`);