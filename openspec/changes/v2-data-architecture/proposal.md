## Why

The current V1 data layer was built incrementally and has fundamental architectural gaps: no invoice system, a split appointment/session model that causes synchronization bugs, insufficient insurance billing support for Morocco's convention-based workflows, and no payment-to-invoice traceability. Starting a fresh project with the same tech stack lets us apply all domain learnings — the Jane App merged-appointment pattern, Morocco-specific convention billing, and proper double-entry financial tracking — from a clean foundation.

## What Changes

- **BREAKING**: Merge `appointments` and `treatment_sessions` into a single `appointments` table with one unified state machine (`scheduled → confirmed → in_progress → finished → completed / cancelled / no_show`)
- **NEW**: Full invoice system — single `invoices` table with `type` discriminator (`convention` / `remboursement`), `invoice_line_items`, and `invoice_appointments` junction with price-locking per invoice type
- **NEW**: Insurance company model — `insurance_companies` table with convention attributes (coverage %, session price, co-pay rules). Insurance context flows from `treatment_plans` → inherited by `appointments` and `invoices`. No `insurance_policies` table.
- **BREAKING**: Enhanced payments — `payerType` (patient / insurance_company), `payment_allocations` junction linking payments to both invoices AND appointments, `portion` field (`full` / `copay` / `insurance`) tracking what each allocation covers
- **NEW**: Credit notes — `credit_notes` table for invoice corrections/refunds with `credit_note_allocations` junction
- **NEW**: Configurable services — `services` table replaces hardcoded `VALID_APPOINTMENT_TYPES` enum
- **NEW**: Packages (schema only) — `packages` + `patient_packages` tables for future prepaid treatment bundles
- **BREAKING**: Per-appointment co-pay tracking — `expectedCoPayCents`, `expectedInsuranceCents`, `coPayPaidCents`, `insurancePaidCents` with denormalized `paymentStatus`
- **NEW**: Session locking — `isLocked`, `lockedAt`, `lockedById` prevent post-invoice modification
- **BREAKING**: All enums in `base.types.ts` reworked — merged appointment statuses, expanded payment types/methods, new invoice/credit-note enums

## Capabilities

### New Capabilities

- `invoice-system`: Invoice creation, line items, appointment attachment, price locking, status flows (convention: draft → sent → paid/partially_paid → cancelled; remboursement: draft → issued → cancelled), pro-forma support
- `insurance-conventions`: Insurance company management with convention attributes, coverage calculation, co-pay tracking, insurance context inheritance from treatment plans
- `credit-notes`: Credit note creation for invoice corrections, allocation to original invoices, immutable ledger pattern
- `services-catalog`: Configurable appointment types/services replacing hardcoded enum, org-scoped with pricing and duration defaults
- `financial-ledger`: Immutable payment recording, payer attribution, payment-invoice-appointment traceability via `payment_allocations`, deposit management
- `session-locking`: Post-invoice/payment locking mechanism preventing data modification after financial events

### Modified Capabilities

- `data-layer`: Complete schema replacement — merged appointment model, enhanced patients, new relations file, new column helpers, all new schema files
- `treatment-session`: Eliminated — absorbed into merged appointments. State machine, clinical fields, and billing fields unified in one table
- `payment-tracking`: Enhanced with payer types, payment allocations, invoice linking, co-pay tracking, expanded payment types/methods
- `treatment-plan`: Enhanced with `insuranceCompanyId` FK as source of truth for insurance context inheritance

## Impact

- **Database**: All 17 domain tables rewritten/created from scratch (9 auth tables untouched — better-auth managed)
- **Shared types**: `base.types.ts` enum overhaul (~33 additions/modifications), `org.types.ts` additions, `invoicing.ts` enhancements
- **API routes**: All domain routes rewritten to new schema shapes
- **Frontend**: `facturation.vue`, payment composables, billing slideovers — all redesigned for new financial model
- **Infrastructure**: KV for sequential invoice/receipt numbering, Queues for PDF generation + reminders, Durable Objects for atomic counters
- **Compliance**: All patient financial data follows immutable ledger pattern — never UPDATE amounts, only INSERT compensating records
- **Cloudflare constraints**: Sequential numbering via KV/DO (D1 has no SEQUENCE), async jobs via Queues (PDFs, status recalculation within CPU limits)
