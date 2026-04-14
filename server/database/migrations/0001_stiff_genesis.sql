CREATE TABLE `insurance_companies` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`coveragePercentage` integer NOT NULL,
	`sessionPriceCents` integer NOT NULL,
	`coPayRule` text NOT NULL,
	`coPayAmountCents` integer,
	`coPayPercentage` integer,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer,
	CONSTRAINT `fk_insurance_companies_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `insuranceCompanyId` text REFERENCES insurance_companies(id);--> statement-breakpoint
ALTER TABLE `appointments` ADD `expectedCoPayCents` integer;--> statement-breakpoint
ALTER TABLE `appointments` ADD `expectedInsuranceCents` integer;--> statement-breakpoint
ALTER TABLE `appointments` ADD `coPayPaidCents` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `appointments` ADD `insurancePaidCents` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `treatment_plans` ADD `insuranceCompanyId` text REFERENCES insurance_companies(id);--> statement-breakpoint
CREATE INDEX `idx_appointments_insurance` ON `appointments` (`insuranceCompanyId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_companies_org` ON `insurance_companies` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_insurance_companies_org_status` ON `insurance_companies` (`organizationId`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_insurance_companies_org_code` ON `insurance_companies` (`organizationId`,`code`);--> statement-breakpoint
CREATE INDEX `idx_treatment_plans_insurance` ON `treatment_plans` (`insuranceCompanyId`);