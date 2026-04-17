## Why

Current payment system has two critical gaps: no payer attribution (can't track if payment came from patient or insurance) and no direct payment-to-invoice link. The V1 `appointment_payment_items` table only links payments to appointments — invoices are orphaned. This breaks financial traceability needed for Morocco's co-pay billing.

## What Changes

- **ENHANCEMENT**: `payments` table — add `payerType` (patient/insurance_company), `payerInsuranceCompanyId` FK (required when payerType is insurance_company)
- **BREAKING**: Replace `appointment_payment_items` table with `payment_allocations` junction table — links payments to BOTH invoices AND appointments with `portion` field (`full`/`copay`/`insurance`)
- **NEW**: `credit_notes` table — for invoice corrections/refunds with immutable ledger pattern
- **NEW**: `credit_note_allocations` table — links credit notes to invoices
- **NEW**: Enums in `base.types.ts`:
  - `PAYMENT_PAYER_TYPES` (`patient`, `insurance_company`)
  - `PAYMENT_PORTIONS` (`full`, `copay`, `insurance`)
  - `CREDIT_NOTE_TYPES` (`correction`, `refund`)
  - `CREDIT_NOTE_STATUSES` (`draft`, `issued`, `cancelled`)
- **EXPANDED**: `PAYMENT_TYPES` enum — add `insurance_payment`, `insurance_refund`, `credit_note_applied`, `write_off`
- **EXPANDED**: `PAYMENT_METHODS` enum — add `insurance-electronic`

## Capabilities

### New Capabilities

- `payment-payer-attribution`: Track who funded each payment (patient vs insurance company)
- `payment-allocations`: Link payments to both invoices and appointments with portion tracking
- `credit-notes`: Create credit notes for invoice corrections/refunds

### Modified Capabilities

- `payment-tracking`: Enhanced with payer types, payment allocations, credit notes, expanded types/methods

## Impact

- **Database**: 2 new tables (`credit_notes`, `credit_note_allocations`), 1 table replaced (`appointment_payment_items` → `payment_allocations`), 1 table enhanced (`payments`)
- **Shared types**: 4 new enums, 2 expanded enums
- **API routes**: Add credit note CRUD, replace appointment-payment-items APIs with payment-allocations APIs, enhance payment APIs
- **Frontend**: Add credit note UI, update payment forms with payer attribution
- **Compliance**: Immutable ledger pattern for financial records

## Note

`payment_allocations.invoiceId` FK is nullable — can link payments to appointments only initially. When invoice system is added later, the invoice link can be populated.
