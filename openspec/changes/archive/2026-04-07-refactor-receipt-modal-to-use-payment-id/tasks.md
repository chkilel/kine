## 1. Implementation

- [x] 1.1 Add a single-payment fetch composable (`usePayment`) if it doesn't exist yet
- [x] 1.2 Refactor `ReceiptModal.vue` to accept `paymentId` prop and use `usePayment(paymentId)` + `usePaymentReceipt(paymentId)` directly, removing `useTreatmentSessionPayments` and the `payment` computed
- [x] 1.3 Update `app/pages/patients/[id]/facturation.vue` — pass `paymentId` instead of `sessionId` (lines 107, 111)
- [x] 1.4 Update `app/components/payment/PaymentHistorySlideover.vue` — pass `paymentId` instead of `sessionId` (line 17)
- [x] 1.5 Update `app/components/payment/PaymentSummaryCard.vue` — pass `paymentId` instead of `sessionId` (line 22)
- [x] 1.6 Remove unused imports (`useTreatmentSessionPayments`) where applicable
