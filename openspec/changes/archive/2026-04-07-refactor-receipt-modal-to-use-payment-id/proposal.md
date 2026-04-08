# Change: Refactor ReceiptModal to accept paymentId instead of sessionId

## Why

`ReceiptModal.vue` currently accepts a `sessionId` prop, fetches all payments for that session, then picks the first payment to display its receipt. This is an unnecessary indirection — callers already have or can access the `paymentId` and should pass it directly. The current approach also has a bug: it always picks the first payment, which may not be the intended one.

## What Changes

- **BREAKING** `ReceiptModal.vue` prop changes from `sessionId: string` to `paymentId: string`
- Add a `usePayment(paymentId)` composable to fetch a single payment by ID
- Remove `useTreatmentSessionPayments` call and the `payment` computed (first-payment selection) from `ReceiptModal`
- Use `paymentId` directly with `usePaymentReceipt`
- Update all call sites to pass `paymentId` instead of `sessionId`

## Call-site impact analysis

1. **`app/components/payment/PaymentSummaryCard.vue:22`** — Already fetches `sessionPayments` and computes `latestPayment`. Pass `latestPayment.id` instead of `sessionId`.

2. **`app/components/payment/PaymentHistorySlideover.vue:12-18`** — Already receives `paymentId` as parameter. Remove the workaround that looks up `sessionId` from payment's sessionItems. Pass `paymentId` directly.

3. **`app/pages/patients/[id]/facturation.vue:106-111`** — `handleViewReceipt(sessionId)` is called from `PaymentBillingSessionCard` via `@view-receipt`. Needs to be changed to accept `paymentId` (the emitting component should emit `paymentId` instead). `handleDownloadReceipt(payment.id)` at line 271 already has `paymentId` available.

## Impact

- Affected specs: `payment-tracking`
- Affected code:
  - `app/components/app/ReceiptModal.vue` — core refactor
  - `app/composables/usePayment.ts` — add `usePayment` composable
  - `app/pages/patients/[id]/facturation.vue` — pass `paymentId` instead of `sessionId`
  - `app/components/payment/PaymentHistorySlideover.vue` — simplify to pass `paymentId` directly
  - `app/components/payment/PaymentSummaryCard.vue` — pass `latestPayment.id` instead of `sessionId`
