# Change: Connect Payment Management UI to API

## Why

The billing page (`facturation.vue`) and 5 overlay components (RecordPaymentSlideover, AddDepositSlideover, RefundBalanceSlideover, PaymentHistorySlideover, CancelPaymentModal) were built with static mock data. The backend APIs already exist (POST /payments, POST /payments/:id/void, GET /payments/:id/receipt, GET /treatment-sessions/:id/payments, GET /patients/:id/balance) but the UI is not wired. A new listing endpoint is needed for patient payment history.

## What Changes

- **Add** `GET /api/patients/:id/payments` - List payments for a patient with type filtering and pagination (RESTful: nested resource under patient)
- **Add** `GET /api/treatment-sessions?patientId=...&status=finished,completed&includePaymentStatus=true` - Enhance existing sessions list to return per-session payment status (amount paid vs cost) via query param
- **Wire** billing page (`facturation.vue`) to fetch real sessions with payment status and real payment history from API
- **Wire** `RecordPaymentSlideover` to use `useCreatePayment` mutation with real session data
- **Wire** `AddDepositSlideover` to use `useCreatePayment` mutation (deposit_add type)
- **Wire** `RefundBalanceSlideover` to use `useCreatePayment` mutation (deposit_refund type) with balance validation
- **Wire** `PaymentHistorySlideover` to fetch real payment list from new `GET /api/patients/:id/payments` endpoint
- **Wire** `CancelPaymentModal` to call void endpoint via new `useVoidPayment` composable
- **Wire** `BillingBalanceCard` to use `usePatientBalance` composable
- **Wire** `BillingFinancialSummaryCard` to compute totals from real session/payment data
- **Wire** `BillingSessionCard` to render receipt button linking to existing `ReceiptModal`
- **Add** `useVoidPayment` composable wrapping POST /payments/:id/void
- **Add** `usePatientPayments` composable wrapping GET /api/patients/:id/payments
- **Add** `usePatientSessionsPaymentStatus` composable wrapping enhanced sessions list
- **Remove** all mock data from `facturation.vue` and overlay components

## Impact

- Affected specs: `payment-tracking` (MODIFIED: Billing Page Layout, Session Billing Cards, Payment History Slideover, Record Payment Slideover, Add Deposit Slideover, Refund Balance Slideover, Cancel Payment Modal)
- Affected code:
  - `app/pages/patients/[id]/facturation.vue` - replace mock data with API calls
  - `app/components/payment/RecordPaymentSlideover.vue` - wire to useCreatePayment
  - `app/components/payment/AddDepositSlideover.vue` - wire to useCreatePayment
  - `app/components/payment/RefundBalanceSlideover.vue` - wire to useCreatePayment
  - `app/components/payment/PaymentHistorySlideover.vue` - wire to usePatientPayments
  - `app/components/payment/CancelPaymentModal.vue` - wire to useVoidPayment
  - `app/components/payment/BillingSessionCard.vue` - wire receipt button
  - `app/components/payment/BillingBalanceCard.vue` - wire to usePatientBalance
  - `app/components/payment/BillingFinancialSummaryCard.vue` - wire to real data
  - `app/composables/usePayment.ts` - add useVoidPayment, usePatientPayments
  - New: `server/api/patients/[id]/payments/index.get.ts`
  - Modified: `server/api/treatment-sessions/index.get.ts` - add payment status enrichment
  - Modified: `shared/types/invoicing.ts` - add patient payments query schema
