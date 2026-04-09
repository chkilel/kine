## Phase 1: Read-only billing page

Goal: The billing page displays real data (sessions, payment history, balance, financial summary) with no mutation wiring yet. All filters and calculations work client-side.

- [x] 1.1 Add `patientPaymentsQuerySchema` to `shared/types/invoicing.ts` with `type`, `limit`, `includeVoided` query params
- [x] 1.2 Create `server/api/patients/[id]/payments/index.get.ts` — list payments for a patient with session items joined, filtering, ordering by paidOn desc
- [x] 1.3 Enhance `server/api/treatment-sessions/index.get.ts` — add `includePaymentStatus` query param that enriches sessions with `paidCents` and `paymentStatus` via subquery join
- [x] 1.4 Add `PAYMENT_KEYS.patientPayments(patientId)` query key to `app/composables/usePayment.ts`
- [x] 1.5 Add `usePatientPayments(patientId, filters?)` composable wrapping GET /api/patients/:id/payments
- [x] 1.6 Add `usePatientSessionsPaymentStatus(patientId)` composable wrapping GET /api/treatment-sessions?patientId=...&includePaymentStatus=true
- [x] 1.7 Wire `BillingSessionCard.vue` — accept real session data with `paymentStatus` and `paidCents`, compute remaining amount, update emit payloads
- [x] 1.8 Wire `facturation.vue` — replace mock sessions with `usePatientSessionsPaymentStatus`, replace mock payment history with `usePatientPayments({ limit: 5 })`, replace filter options with "Toutes / Sans plan / Par plan" + count badges from real sessions
- [x] 1.9 Wire `BillingBalanceCard.vue` — replace mock data with props from `usePatientBalance`
- [x] 1.10 Wire `BillingFinancialSummaryCard.vue` — compute totals client-side from fetched sessions (billed, collected, remaining, recovery rate), update instantly on filter change
- [x] 1.11 Remove all mock data types and arrays from `facturation.vue`
- [x] 1.12 Run `pnpm typecheck` and `pnpm test`

## Phase 2: Record payment flow

Goal: The user can record a session payment (cash, card, check, transfer, or deposit balance) from the billing page. The payment is created via API, the page refreshes, and the session status updates.

- [x] 2.1 Wire `RecordPaymentSlideover.vue` — replace mock session list with real patient sessions (passed as props), pre-fill amount from session.priceCent
- [x] 2.2 Wire form submission to `useCreatePayment` mutation with correct `PaymentRequestBody` (type="session_payment", sessionItems mapped from selected sessions)
- [x] 2.3 Wire deposit method toggle to `usePatientBalance` for credit check display
- [x] 2.4 Close slideover and trigger data refresh on successful payment creation
- [x] 2.5 Handle API errors with form-level error display
- [x] 2.6 Update `useCreatePayment` onSuccess to invalidate `PAYMENT_KEYS.patientPayments(patientId)` and session payment status queries
- [x] 2.7 Update `handleRecordPayment` and `handleOpenRecordPayment` in `facturation.vue` to pass real session IDs and data
- [x] 2.8 Run `pnpm typecheck` and `pnpm test`

## Phase 3: Deposit and refund flows

Goal: The user can add a deposit (advance) and refund unused deposit balance from the sidebar card. The balance card reflects changes immediately.

- [x] 3.1 Wire `AddDepositSlideover.vue` — submit to `useCreatePayment` with type="deposit_add" and empty sessionItems
- [x] 3.2 Close slideover and refresh balance/payments on success
- [x] 3.3 Handle API errors with form-level error display
- [x] 3.4 Wire `RefundBalanceSlideover.vue` — replace mock balance with `usePatientBalance` real data
- [x] 3.5 Add client-side validation: refund amount must not exceed current balance
- [x] 3.6 Submit to `useCreatePayment` with type="deposit_refund" and empty sessionItems
- [x] 3.7 Close slideover and refresh on success
- [x] 3.8 Handle API errors with form-level error display
- [x] 3.9 Run `pnpm typecheck` and `pnpm test`

## Phase 4: Payment history and void flow

Goal: The user can browse full payment history with filters, view receipts, and void payments. The void action updates session statuses.

- [x] 4.1 Add `useVoidPayment()` mutation composable wrapping POST /api/payments/:id/void with toast + cache invalidation
- [x] 4.2 Ensure `useVoidPayment` invalidates patient payments, session payments, and session status caches on success
- [x] 4.3 Wire `PaymentHistorySlideover.vue` — replace mock list with `usePatientPayments({ includeVoided: true })`
- [x] 4.4 Wire filter tabs to query params (Tous, Paiements=session_payment, Avances=deposit_add, Remb. séances=session_refund, Remb. avances=deposit_refund, Annulés=includeVoided=true)
- [x] 4.5 Wire receipt download button to open `ReceiptModal` with `usePaymentReceipt(paymentId)`
- [x] 4.6 Disable void button for voided payments and refund types (session_refund, deposit_refund)
- [x] 4.7 Wire void/cancel button to open `CancelPaymentModal` with the selected payment context
- [x] 4.8 Remove all mock data from `PaymentHistorySlideover.vue`
- [x] 4.9 Wire `CancelPaymentModal.vue` — accept real payment as prop, display real details (receipt number, amount, method, date, linked sessions)
- [x] 4.10 Wire "Annuler définitivement" button to `useVoidPayment` composable
- [x] 4.11 Close modal and refresh on successful void
- [x] 4.12 Handle API errors (refund types not voidable, already voided) with error display
- [x] 4.13 Remove all mock data from `CancelPaymentModal.vue`
- [x] 4.14 Wire receipt button on paid `BillingSessionCard` to open `ReceiptModal`
- [x] 4.15 Run `pnpm typecheck` and `pnpm test`
