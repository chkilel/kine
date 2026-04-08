# Change: Implement Static Payment Management UI on Patient Billing Tab

## Why

The patient billing page (`app/pages/patients/[id]/facturation.vue`) is currently a placeholder with hardcoded mock data. It needs to be replaced with a fully functional static UI (no API wiring yet) that matches the Stitch design reference screens, using Nuxt UI components and the project's existing patterns.

## What Changes

- **Replace** the placeholder billing page with a comprehensive payment management UI
- **Add** 5 new slideover/modal components following existing `useOverlay()` patterns:
  1. `PaymentHistorySlideover` - full payment history with filters
  2. `RecordPaymentSlideover` - record payment with session selection and method picker
  3. `AddDepositSlideover` - add advance/deposit with payment method icons
  4. `RefundBalanceSlideover` - refund unused deposit credit
  5. `CancelPaymentModal` - void payment confirmation with safety input
- **Add** billing page sections: segment filter bar (`Toutes` | `Sans Plan` | `Par plan` with dropdown), sessions-to-bill cards, payment history preview, patient balance sidebar card, financial summary sidebar card
- **"Enregistrer un paiement"** button is in the right sidebar (above the balance card), not in the filter bar
- **Use** Nuxt UI components (USlideover, UModal, UCard, UButton, UBadge, UProgress, UAlert, etc.) with Nuxt UI color tokens -- no Stitch colors

## Impact

- Affected specs: `payment-tracking` (UI-only, no spec changes to backend requirements)
- Affected code:
  - `app/pages/patients/[id]/facturation.vue` - full rewrite
  - New: `app/components/payment/PaymentHistorySlideover.vue`
  - New: `app/components/payment/RecordPaymentSlideover.vue`
  - New: `app/components/payment/AddDepositSlideover.vue`
  - New: `app/components/payment/RefundBalanceSlideover.vue`
  - New: `app/components/payment/CancelPaymentModal.vue`
  - New: `app/components/payment/BillingSessionCard.vue`
  - New: `app/components/payment/BillingBalanceCard.vue`
  - New: `app/components/payment/BillingFinancialSummaryCard.vue`

## Design References

Stitch screens downloaded to `references/stitch-screens/`:

1. `screen1-facturation-main` - main billing page layout (original)
2. `screen7-facturation-filter-updated` - updated filter bar with segment + repositioned actions
3. `screen2-payment-history-slideover` - payment history slideover
4. `screen3-cancel-payment-modal` - cancel payment confirmation modal
5. `screen4-refund-balance-slideover` - refund balance modal
6. `screen5-add-deposit-slideover` - add deposit slideover
7. `screen6-record-payment-slideover` - record payment slideover
