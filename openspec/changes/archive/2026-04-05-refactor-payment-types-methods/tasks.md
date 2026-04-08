## 1. Update Type Definitions

- [x] 1.1 Update `shared/types/base.types.ts` — add `'deposit'` to `PAYMENT_METHODS`, replace `PAYMENT_TYPES` with `['session_payment', 'session_refund', 'deposit_add', 'deposit_refund']`, update Zod schemas and TypeScript types

## 2. Update Display Configuration

- [x] 2.1 Update `shared/utils/constants.invoicing.ts` — add `deposit` entry to `PAYMENT_METHODS_CONFIG` (label: "Solde patient", icon/color), update `PAYMENT_TYPE_CONFIG` for new types (`session_payment`, `session_refund`, `deposit_add`, `deposit_refund`), update `PAYMENT_TYPE_OPTIONS` and helper functions

## 3. Update API Schemas

- [x] 3.1 Update `shared/types/invoicing.ts` — update `paymentCreateSchema` to use new type defaults, make `method` required in all schemas, update `paymentRequestBodySchema`, `paymentFormSchema`, and query schemas for new types

## 4. Update Database Schema

- [x] 4.1 Update `server/database/schema/payment.ts` — change `method` column from nullable to NOT NULL, update type enum to use new type values

## 5. Update API Endpoints

- [x] 5.1 Update `server/api/payments/index.post.ts` — replace type-based branching (`payment`/`credit_usage`/`deposit`/`refund`) with new types (`session_payment`/`session_refund`/`deposit_add`/`deposit_refund`), update credit balance validation to check `method='deposit'`, make method required
- [x] 5.2 Update `server/api/patients/[id]/balance.get.ts` — change balance formula from `SUM(deposit) - SUM(credit_usage)` to `SUM(deposit_add) - SUM(session_payment WHERE method='deposit') - SUM(deposit_refund)`
- [x] 5.3 Update `server/api/payments/[id]/receipt.get.ts` — update type labels for new types, handle `method='deposit'` display as "Solde patient", remove null-method handling
- [x] 5.4 Update `server/api/payments/[id]/void.post.ts` — update session status restoration query to use `type='session_payment'` instead of `type IN ('payment', 'credit_usage')`
- [x] 5.5 Update `server/api/treatment-sessions/[id]/payments.get.ts` — verify query works with new types (no changes expected if using generic type filter)

## 6. Update Frontend Components

- [x] 6.1 Update `app/components/payment/PaymentCard.vue` — replace "Solde" pseudo-method with `method='deposit'` button, set `type='session_payment'` always (not `credit_usage`), always include method in API payload
- [x] 6.2 Update `app/components/payment/PaymentTransactionCard.vue` — update type options to new types, remove `credit_usage` special handling, use `method='deposit'` option
- [x] 6.3 Update `app/components/payment/PaymentSummaryCard.vue` — update method display for `method='deposit'` (show "Solde patient"), remove null-method handling
- [x] 6.4 Update `app/components/payment/RecordPaymentSlideover.vue` — add `deposit` method button alongside other methods, update type to `session_payment`, remove credit_usage toggle in favor of method selection
- [x] 6.5 Update `app/components/payment/AddDepositSlideover.vue` — set `type='deposit_add'` (was `deposit`), require method selection
- [x] 6.6 Update `app/components/payment/RefundBalanceSlideover.vue` — set `type='deposit_refund'` (was `refund`), require method selection
- [x] 6.7 Update `app/components/payment/PaymentHistorySlideover.vue` — update type filter tabs for new types, update method display for `method='deposit'`
- [x] 6.8 Update `app/components/app/ReceiptModal.vue` — remove `credit_usage` special casing, handle `method='deposit'` display

## 7. Update Seed Data and Org Settings

- [x] 7.1 Update `server/api/db/seed.post.ts` — replace old type values in seed payment records with new types, ensure all payments have method set (no payment seed data exists; no changes needed)
- [x] 7.2 Update `app/components/organization/LegalInformationTab.vue` — exclude `deposit` from org default payment method using `PAYMENT_FUNDING_METHOD_OPTIONS`

## 8. Validation

- [x] 8.1 Run `pnpm typecheck` to verify all TypeScript types compile (all payment-related errors resolved; pre-existing errors remain)
- [x] 8.2 Run `pnpm lint` to verify no lint errors (no lint script configured)
- [x] 8.3 Run `pnpm test` to verify all existing tests pass with updated types (240/241 pass; 1 pre-existing failure in date-utils)
- [ ] 8.4 Manually verify payment creation for each type+method combination (requires running dev server)

## 9. Tests

- [x] 9.1 Create `shared/types/payment-types.spec.ts` — unit tests for PAYMENT_TYPES and PAYMENT_METHODS constants, Zod schema validation, TypeScript type inference
- [x] 9.2 Create `shared/utils/constants.invoicing.spec.ts` — unit tests for display configuration
- [x] 9.3 Create `shared/types/invoicing.spec.ts` — unit tests for API Zod schemas
- [ ] 9.4 Create `server/api/payments/payment-creation.spec.ts` — unit tests for payment creation logic (deferred: requires test database setup)
- [ ] 9.5 Create `server/api/patients/balance.spec.ts` — unit tests for balance calculation (deferred: requires test database setup)
- [ ] 9.6 Create `server/api/payments/payment-voiding.spec.ts` — unit tests for void logic (deferred: requires test database setup)
- [ ] 9.7 Create `server/api/payments/session-linking.spec.ts` — unit tests for session payment status (deferred: requires test database setup)
- [ ] 9.8 Create `server/api/payments/receipt.spec.ts` — unit tests for receipt rendering (deferred: requires test database setup)
- [x] 9.9 Update `server/api/db/seed.post.ts` tests — verify seed data uses new types (no payment seed data; no legacy types in codebase)
- [x] 9.10 Run full test suite `pnpm test` and verify all pass (240/241; 1 pre-existing failure)
- [ ] 9.11 Run `pnpm test:coverage` and verify no uncovered critical paths (deferred: tasks 9.4-9.8 require test infrastructure)
