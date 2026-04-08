# Change: Refactor Payment Types and Methods

## Why

The current payment system conflates concerns: `credit_usage` is both a payment type and implies a funding source, while `deposit` is a type but semantically acts like a method. This creates inconsistency where some payments have both type+method and others (credit_usage, some deposits) have no method at all. The system is pre-production, so we can do a clean refactoring without migration paths.

## What Changes

- **BREAKING**: Add `'deposit'` to `PAYMENT_METHODS` — using deposit balance as a funding source
- **BREAKING**: Replace legacy `PAYMENT_TYPES` (`payment`, `deposit`, `credit_usage`, `refund`) with semantic types: `session_payment`, `session_refund`, `deposit_add`, `deposit_refund`
- **BREAKING**: Remove `credit_usage` type entirely — replaced by `session_payment` with `method='deposit'`
- **BREAKING**: Make `method` field required (non-nullable) on all payments — every payment must have both a type (what happens) and a method (how it's funded)
- Update `shared/types/base.types.ts` constants and Zod schemas
- Update `shared/utils/constants.invoicing.ts` display config (labels, icons, colors)
- Update `shared/types/invoicing.ts` API schemas
- Update `server/database/schema/payment.ts` DB schema (method becomes NOT NULL)
- Update `server/api/payments/index.post.ts` creation logic
- Update `server/api/patients/[id]/balance.get.ts` balance calculation
- Update `server/api/payments/[id]/receipt.get.ts` receipt rendering
- Update `server/api/payments/[id]/void.post.ts` void logic
- Update all frontend components that reference payment types/methods
- Update seed data in `server/api/db/seed.post.ts`

## Impact

- Affected specs: `payment-tracking` (all requirements touching types, methods, validation, balance, receipts)
- Affected code:
  - `shared/types/base.types.ts` — constants and schemas
  - `shared/utils/constants.invoicing.ts` — display config
  - `shared/types/invoicing.ts` — API schemas
  - `server/database/schema/payment.ts` — DB schema
  - `server/api/payments/index.post.ts` — creation endpoint
  - `server/api/patients/[id]/balance.get.ts` — balance calculation
  - `server/api/payments/[id]/receipt.get.ts` — receipt HTML
  - `server/api/payments/[id]/void.post.ts` — void endpoint
  - `server/api/treatment-sessions/[id]/payments.get.ts` — session payments
  - `server/api/db/seed.post.ts` — seed data
  - `app/components/payment/*.vue` — all 11 payment components
  - `app/components/app/ReceiptModal.vue` — receipt viewer
  - `app/components/organization/LegalInformationTab.vue` — org settings
  - `app/composables/usePayment.ts` — payment composables
  - `app/pages/patients/[id]/facturation.vue` — billing page
