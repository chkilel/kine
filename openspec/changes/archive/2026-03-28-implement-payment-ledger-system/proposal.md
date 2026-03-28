# Change: Implement Payment Ledger System

## Why

Kine currently lacks a comprehensive payment tracking system. Therapists need to record payments, manage deposits/credits, and generate receipts for sessions. The current system has billing fields on treatment sessions but no financial ledger, audit trail, or support for advance payments and credit balance tracking.

## What Changes

- Add new `payments` table as immutable financial ledger with receipt numbering
- Add new `payment_session_items` table as single mechanism linking payments to sessions
- Remove `billed` field from `treatment_sessions` (status now derived from payment links)
- Add receipt configuration (`receiptPrefix`, `nextReceiptNumber`) to `organizations.fiscal` JSON
- Implement payment recording workflow for cash/card payments (Workflow A)
- Implement deposit and credit usage workflow (Workflow B)
- Add patient credit balance calculation from ledger (no separate table)
- Implement void/correction pattern for payment mistakes
- Generate "reçu de paiement" documents from payment records
- Add Payment Card component to Treatment Session Slideover for recording payments
- Add API endpoints: POST /payments, POST /payments/:id/void, GET /payments/:id/receipt, GET /patients/:id/balance

## Impact

**Affected specs:**

- **payment-tracking** (NEW) - New capability for financial ledger, receipts, credit balances
- **treatment-session** (MODIFIED) - Remove `billed` field, add derived payment status
- **organization** (MODIFIED) - Add receipt configuration to fiscal JSON

**Affected code:**

- Database: New schema files, migration, indexes
- API: New endpoints, modified session queries
- UI: New Payment Card component in session slideover, receipt rendering
- Business logic: Credit balance calculation, receipt number generation, voiding
