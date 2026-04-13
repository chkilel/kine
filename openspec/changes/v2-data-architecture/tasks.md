## 1. Shared Types & Enums

- [ ] 1.1 Update `shared/types/base.types.ts` — add `INVOICE_TYPES` enum (`convention`, `remboursement`)
- [ ] 1.2 Update `shared/types/base.types.ts` — add `INVOICE_STATUSES` enum (`draft`, `sent`, `paid`, `partially_paid`, `issued`, `cancelled`)
- [ ] 1.3 Update `shared/types/base.types.ts` — replace `APPOINTMENT_STATUSES` with merged set (`scheduled`, `confirmed`, `in_progress`, `finished`, `completed`, `cancelled`, `no_show`) and remove `TREATMENT_SESSION_STATUSES`
- [ ] 1.4 Update `shared/types/base.types.ts` — expand `PAYMENT_TYPES` to include `insurance_payment`, `insurance_refund`, `credit_note_applied`, `write_off`
- [ ] 1.5 Update `shared/types/base.types.ts` — expand `PAYMENT_METHODS` to include `insurance-electronic`; add `credit-note` and `write-off` as internal methods
- [ ] 1.6 Update `shared/types/base.types.ts` — add `PAYMENT_PAYER_TYPES` enum (`patient`, `insurance_company`)
- [ ] 1.7 Update `shared/types/base.types.ts` — add `PAYMENT_PORTIONS` enum (`full`, `copay`, `insurance`)
- [ ] 1.8 Update `shared/types/base.types.ts` — add `CREDIT_NOTE_TYPES` enum (`correction`, `refund`)
- [ ] 1.9 Update `shared/types/base.types.ts` — add `CREDIT_NOTE_STATUSES` enum (`draft`, `issued`, `cancelled`)
- [ ] 1.10 Update `shared/types/base.types.ts` — add `APPOINTMENT_PAYMENT_STATUSES` enum (`unpaid`, `copay_paid`, `partially_paid`, `paid`, `overpaid`)
- [ ] 1.11 Update `shared/types/base.types.ts` — add `VALID_CONVENTION_STATUSES` enum (`active`, `suspended`, `terminated`)
- [ ] 1.12 Update `shared/types/base.types.ts` — remove `VALID_APPOINTMENT_TYPES` enum (replaced by services table)
- [ ] 1.13 Update `shared/types/org.types.ts` — add `invoicePrefix`, `receiptPrefix`, `nextInvoiceNumber`, `nextReceiptNumber` to org fiscal config type

## 2. Column Helpers

- [ ] 2.1 Update `server/database/schema/columns.helpers.ts` — ensure timestamps mixin (`createdAt`, `updatedAt`) with `sql'(unixepoch())'` defaults
- [ ] 2.2 Update `server/database/schema/columns.helpers.ts` — ensure soft delete mixin (`deletedAt`)
- [ ] 2.3 Update `server/database/schema/columns.helpers.ts` — add org scope mixin (`orgId` with FK to organization table)
- [ ] 2.4 Update `server/database/schema/columns.helpers.ts` — add calendar date mixin (`date` as text in `YYYY-MM-DD` format)

## 3. Unchanged Schema Files

- [ ] 3.1 Verify `server/database/schema/auth.ts` remains untouched (better-auth managed)
- [ ] 3.2 Verify `server/database/schema/organization.ts` remains untouched (better-auth managed)
- [ ] 3.3 Verify `server/database/schema/rooms.ts` is compatible with V2 (no changes needed)
- [ ] 3.4 Verify `server/database/schema/availability.ts` is compatible with V2 (no changes needed)
- [ ] 3.5 Verify `server/database/schema/document.ts` is compatible with V2 (no changes needed)

## 4. New Schema: Services

- [ ] 4.1 Create `server/database/schema/service.ts` — `services` table with `orgId`, `name`, `description`, `defaultDurationMinutes`, `defaultPricing` (JSON), `isActive`, `color` (optional), timestamps, soft delete
- [ ] 4.2 Write Vitest unit tests for service schema column definitions

## 5. New Schema: Insurance Companies

- [ ] 5.1 Create `server/database/schema/insurance-company.ts` — `insurance_companies` table with `orgId`, `name`, `coveragePercentage`, `defaultSessionPriceCents`, `patientCoPayPercentage`, `contactEmail`, `contactPhone`, `address`, `conventionStatus`, timestamps, soft delete
- [ ] 5.2 Write Vitest unit tests for insurance company schema column definitions

## 6. New Schema: Patients (Updated)

- [ ] 6.1 Rewrite `server/database/schema/patient.ts` — `patients` table with `orgId`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `phone`, `email`, `address`, `insuranceProvider` (text), `insuranceNumber` (text), `emergencyContactName`, `emergencyContactPhone`, `notes`, timestamps, soft delete
- [ ] 6.2 Write Vitest unit tests for patient schema column definitions

## 7. Updated Schema: Treatment Plans

- [ ] 7.1 Rewrite `server/database/schema/treatment-plan.ts` — `treatment_plans` table with `orgId`, `patientId` FK, `insuranceCompanyId` FK (nullable), `title`, `diagnosis`, `goals`, `pricing` (JSON), `totalSessions`, `sessionsCompleted`, `status`, `startDate`, `endDate`, timestamps, soft delete
- [ ] 7.2 Write Vitest unit tests for treatment plan schema, especially `insuranceCompanyId` FK and pricing JSON columns

## 8. Updated Schema: Appointments (Merged)

- [ ] 8.1 Rewrite `server/database/schema/appointment.ts` — merged `appointments` table absorbing all treatment_session fields: scheduling (`date`, `startTime`, `endTime`, `roomId`, `therapistId`, `serviceId` FK, `patientId` FK, `treatmentPlanId` FK nullable, `location`, `notes`), clinical (`primaryConcern`, `observations`, `treatmentSummary`, `nextSteps`, `painLevelBefore`, `painLevelAfter`, `actualStartTime`, `actualEndTime`), billing (`priceCents`, `expectedCoPayCents`, `expectedInsuranceCents`, `coPayPaidCents`, `insurancePaidCents`, `paymentStatus`), insurance (`insuranceCompanyId` FK nullable), locking (`isLocked`, `lockedAt`, `lockedById`), cancellation (`cancelledAt`, `cancellationReason`), status, `orgId`, timestamps, soft delete
- [ ] 8.2 Write Vitest unit tests for merged appointment schema — verify all field groups present, status enum, FK references
- [ ] 8.3 Delete `server/database/schema/treatment-session.ts` (no longer needed)

## 9. Updated Schema: Payments

- [ ] 9.1 Rewrite `server/database/schema/payment.ts` — enhanced `payments` table with `orgId`, `patientId` FK, `amountCents`, `type`, `method`, `payerType`, `payerInsuranceCompanyId` FK nullable, `paidOn`, `receiptNumber`, `notes`, timestamps, soft delete
- [ ] 9.2 Create `payment_allocations` table in same file — junction with `paymentId` FK, `invoiceId` FK nullable, `appointmentId` FK nullable, `portion`, `amountCents`, timestamps
- [ ] 9.3 Write Vitest unit tests for payment and payment_allocations schema

## 10. New Schema: Invoices

- [ ] 10.1 Create `server/database/schema/invoice.ts` — `invoices` table with `orgId`, `patientId` FK, `insuranceCompanyId` FK nullable, `treatmentPlanId` FK nullable, `invoiceNumber`, `type`, `status`, `totalAmountCents`, `issueDate`, `dueDate`, `sentAt`, `paidAt`, `notes`, timestamps, soft delete
- [ ] 10.2 Create `invoice_line_items` table in same file — `invoiceId` FK, `description`, `quantity`, `pricePerSessionCents`, `totalCents`, timestamps
- [ ] 10.3 Create `invoice_appointments` table in same file — `invoiceId` FK, `appointmentId` FK, `sessionNumber` (nullable, for convention invoices), `priceCents` (nullable, for remboursement invoices), timestamps
- [ ] 10.4 Write Vitest unit tests for invoice, invoice_line_items, invoice_appointments schema

## 11. New Schema: Credit Notes

- [ ] 11.1 Create `server/database/schema/credit-note.ts` — `credit_notes` table with `orgId`, `originalInvoiceId` FK, `patientId` FK, `type`, `status`, `amountCents`, `reason`, `issuedAt`, timestamps, soft delete
- [ ] 11.2 Create `credit_note_allocations` table in same file — `creditNoteId` FK, `invoiceId` FK, `amountCents`, timestamps
- [ ] 11.3 Write Vitest unit tests for credit notes schema

## 12. New Schema: Packages

- [ ] 12.1 Create `server/database/schema/package.ts` — `packages` table with `orgId`, `name`, `description`, `sessionCount`, `totalPriceCents`, `validityDays`, `isActive`, timestamps, soft delete
- [ ] 12.2 Create `patient_packages` table in same file — `orgId`, `patientId` FK, `packageId` FK, `sessionsUsed`, `sessionsRemaining`, `purchasedAt`, `expiresAt`, `status`, timestamps, soft delete
- [ ] 12.3 Write Vitest unit tests for packages schema

## 13. Barrel Export & Relations

- [ ] 13.1 Update `server/database/schema/index.ts` — re-export all new and updated schema tables (services, insurance_companies, invoices, invoice_line_items, invoice_appointments, credit_notes, credit_note_allocations, packages, patient_packages, payment_allocations, merged appointments, enhanced payments, enhanced treatment_plans)
- [ ] 13.2 Rewrite `server/database/relations.ts` — define all V2 relations using `defineRelations()` covering: appointment→patient, appointment→therapist, appointment→service, appointment→treatmentPlan, appointment→insuranceCompany, appointment→room, treatmentPlan→insuranceCompany, treatmentPlan→patient, invoice→patient, invoice→insuranceCompany, invoice→treatmentPlan, invoice→lineItems, invoice→invoiceAppointments, payment→patient, payment→payerInsuranceCompany, payment→allocations, paymentAllocation→appointment, paymentAllocation→invoice, creditNote→originalInvoice, creditNote→patient, creditNote→allocations, creditNoteAllocation→invoice, service→appointments, package→patientPackages, patientPackage→patient, patient→appointments, patient→treatmentPlans, patient→payments, patient→invoices, patient→creditNotes, patient→patientPackages

## 14. Database Migration

- [ ] 14.1 Generate initial Drizzle migration for all V2 schema tables using `drizzle-kit generate`
- [ ] 14.2 Review generated SQL migration for correctness (FK constraints, indexes, defaults)
- [ ] 14.3 Add database indexes: appointments(`orgId`, `status`, `date`), appointments(`patientId`), appointments(`insuranceCompanyId`), invoices(`orgId`, `status`, `type`), invoices(`patientId`), payments(`orgId`, `patientId`), payment_allocations(`paymentId`), payment_allocations(`appointmentId`), payment_allocations(`invoiceId`)

## 15. Integration Verification

- [ ] 15.1 Run `pnpm typecheck` to verify all TypeScript types resolve correctly across schema, relations, and shared types
- [ ] 15.2 Run `pnpm lint` to verify code style compliance on all new/modified files
- [ ] 15.3 Run `pnpm test` to verify all unit tests pass
- [ ] 15.4 Run `drizzle-kit push` against a D1 local database to verify schema applies without errors
