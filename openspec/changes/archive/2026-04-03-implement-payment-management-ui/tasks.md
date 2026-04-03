## 1. Preparation

- [x] 1.1 Review Stitch reference HTML files in `references/stitch-screens/` for layout structure
- [x] 1.2 Review existing payment components (`PaymentCard.vue`, `PaymentTransactionCard.vue`) for reusable patterns
- [x] 1.3 Review existing slideover components (e.g., `TreatmentPlanCreateSlideover.vue`) for `useOverlay()` pattern
- [x] 1.4 Review Nuxt UI components: `USlideover`, `UModal`, `UButton`, `UBadge`, `UProgress`, `UAlert`, `UCheckbox`

## 2. Main Billing Page

- [x] 2.1 Rewrite `app/pages/patients/[id]/facturation.vue` with 3-column grid layout
- [x] 2.2 Add filter bar section: treatment plan `USelectMenu` + status filter `URadioGroup` (pill style)
- [x] 2.3 Add "Séances à facturer" section with session cards (static mock data, 3 statuses)
- [x] 2.4 Add payment history preview section with recent payments list
- [x] 2.5 Add "Enregistrer un paiement" primary action button in filter bar

## 3. Sidebar Cards

- [x] 3.1 Create `app/components/payment/BillingBalanceCard.vue` - patient balance card with deposit amount, unpaid sessions count, total due, "Ajouter une avance" and "Rembourser le solde" buttons
- [x] 3.2 Create `app/components/payment/BillingFinancialSummaryCard.vue` - financial summary with total billed, collected, remaining, recovery rate `UProgress` bar

## 4. Session Billing Cards

- [x] 4.1 Create `app/components/payment/BillingSessionCard.vue` - reusable card with status badge (Non facturé / Partiellement payé / Payé), session info, amount, and contextual action button

## 5. Record Payment Slideover

- [x] 5.1 Create `app/components/payment/RecordPaymentSlideover.vue` - two-step form: session selection checkboxes + payment details (amount, credit toggle, method icons, date, notes)
- [x] 5.2 Use existing `PAYMENT_METHODS_CONFIG` for method icon buttons
- [x] 5.3 Use existing `paymentFormSchema` for form validation

## 6. Add Deposit Slideover

- [x] 6.1 Create `app/components/payment/AddDepositSlideover.vue` - deposit form with info banner, amount input, payment method icons, date, notes

## 7. Payment History Slideover

- [x] 7.1 Create `app/components/payment/PaymentHistorySlideover.vue` - filter tabs (Tous/Paiements/Avances/Remboursements/Annulés), payment list items with receipt number, amount, date, session references, download/void action buttons

## 8. Refund Balance Modal

- [x] 8.1 Create `app/components/payment/RefundBalanceSlideover.vue` - current balance display, refund amount input, refund method selector, warning banner

## 9. Cancel Payment Modal

- [x] 9.1 Create `app/components/payment/CancelPaymentModal.vue` - payment details card, warning banner, "ANNULER" confirmation input, disabled confirm button until typed

## 10. Overlay Composable

- [x] 10.1 Create `app/composables/useBillingSlideover.ts` - `useOverlay()` composable managing all 5 overlay components with open/close methods

## 11. Integration & Validation

- [x] 11.1 Wire billing page buttons to overlay composable open methods
- [x] 11.2 Run `pnpm lint` and fix any issues (no lint command configured)
- [x] 11.3 Run `pnpm typecheck` and fix any type errors (no new errors; pre-existing errors unrelated)
- [x] 11.4 Visual verification: ensure Nuxt UI components render correctly (no Stitch colors)
