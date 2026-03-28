## Context

Kine requires a payment tracking system that supports:

- Recording session payments (cash/card)
- Managing advance deposits and credit balances
- Generating receipt documents ("reçu de paiement")
- Maintaining a complete financial audit trail
- Handling Moroccan insurance context (fee-for-service model)

The current system has a `billed` field on treatment sessions but no financial ledger or support for deposits.

## Goals / Non-Goals

**Goals:**

- Immutable financial ledger with complete audit trail
- Support for cash/card payments, deposits, credit usage, and refunds
- Automatic receipt numbering per organization
- Dynamic credit balance calculation (no separate balance table)
- Single consistent mechanism linking payments to sessions
- Receipt document generation on-demand
- Void/correction pattern for mistakes

**Non-Goals:**

- Formal invoicing system (facture) - separate system
- Payment gateway integration
- Multi-currency support
- Recurring billing or subscriptions

## Decisions

### 1. Ledger-based architecture

**Decision:** All financial events create immutable records in `payments` table. Corrections are done by voiding and creating new records.

**Rationale:**

- Complete audit trail for accounting compliance
- Simplified balance calculation (always derived from ledger)
- Prevents accidental data loss (no hard deletes)
- Clear separation of concerns (ledger vs derived state)

**Alternatives considered:**

- Mutable payment records with edit history: More complex, harder to maintain consistency
- Separate balance table: Prone to sync issues, violates single source of truth

### 2. Single session linking mechanism

**Decision:** All payments link to sessions via `payment_session_items` table. No direct `treatmentSessionId` on payments.

**Rationale:**

- Consistent rule across all payment types (cash, card, credit usage, refund)
- Supports payment splitting across sessions (future flexibility)
- Zero items = deposit (no session yet), 1+ items = linked sessions
- Clear data model: payments are financial events, session items are allocation

**Alternatives considered:**

- Direct foreign key on payments: Inconsistent for deposits, can't handle split payments
- Multiple mechanisms (FK for payments, separate for deposits): Violates single responsibility

### 3. Receipt numbering in organizations.fiscal

**Decision:** Receipt counters live in `organizations.fiscal` JSON: `{ receiptPrefix, nextReceiptNumber }`.

**Rationale:**

- Per-organization numbering isolation
- Transactional updates prevent gaps
- Simple to query and increment
- Configurable prefix per organization

**Alternatives considered:**

- Separate receipt_numbers table: Overkill, adds complexity
- Global counter: Violates multi-tenancy
- Client-side generation: Risk of gaps/duplicates

### 4. Derived session payment status

**Decision:** Session "is paid" status is derived from `payment_session_items` links. Remove `billed` field from `treatment_sessions`.

**Rationale:**

- Single source of truth: payment ledger
- Automatic status updates as payments are added/voided
- No synchronization issues between session.billed and actual payments
- Clear semantic: paid if non-voided payment/credit_usage items exist

**Alternatives considered:**

- Keep `billed` field and sync: Prone to bugs, requires triggers or application logic
- Denormalized for performance: Query performance not yet an issue, adds complexity

### 5. Dynamic credit balance

**Decision:** Patient credit balance is always computed from ledger: `SUM(deposit) - SUM(credit_usage)`. No separate balance table.

**Rationale:**

- No synchronization between balance and ledger
- Always accurate (derived from source of truth)
- Simple query, no balance update logic
- Natural audit trail (balance change = ledger event)

**Alternatives considered:**

- Separate credit_balances table: Prone to drift, requires triggers or scheduled jobs
- Cached computed value: Adds complexity, not yet needed

### 6. Payment types and directionality

**Decision:** `type` enum: `['payment', 'deposit', 'credit_usage', 'refund']`. All `amountCents` are positive. Type carries direction.

**Rationale:**

- Clear semantics: deposit = in, credit_usage = out (to session), refund = out (from unused credit)
- **Refunds only apply to unused deposit credit** - not to session payments. Session payments are corrected by voiding, not refunding.
- No signed integers (always positive simplifies display/calculations)
- Easy to categorize for reports
- Void pattern works for all types

**Alternatives considered:**

- Signed amounts: Complex UI/rendering, risk of negative values in wrong contexts
- Separate in/out tables: Adds complexity for queries

### 7. Receipts only (no formal invoices)

**Decision:** This system generates "reçu de paiement" documents only. Formal "facture" is future invoicing system's responsibility.

**Rationale:**

- Clear separation of concerns: receipts = money movement, invoices = service billing
- Moroccan context: Patients often submit factures to insurers themselves later
- Receipts are simple (amount, date, method), invoices are complex (line items, tax)
- Focused scope for first iteration

**Alternatives considered:**

- Combined receipt/invoice system: Adds significant complexity, delays delivery
- Generate both now: Premature without invoicing spec

## Data Model

### payments table (new)

```typescript
{
  id: text (PK, UUID v7)
  organizationId: text (FK organizations)
  patientId: text (FK patients)
  recordedById: text (FK users) // Who logged the payment

  amountCents: integer (NOT NULL, always positive)
  currency: text (default 'MAD')

  type: enum('payment', 'deposit', 'credit_usage', 'refund') (NOT NULL)
  method: enum('cash', 'card', 'bank_transfer', 'check', 'other') (NOT NULL)

  receiptNumber: text (unique, generated)

  notes: text
  paidOn: text (YYYY-MM-DD, NOT NULL)

  createdAt: timestamp_ms (NOT NULL)
  updatedAt: timestamp_ms (NOT NULL)

  voidedAt: timestamp_ms (nullable)
  voidedById: text (FK users, nullable)
}
```

### payment_session_items table (new)

```typescript
{
  id: text (PK, UUID v7)
  paymentId: text (FK payments, NOT NULL)
  treatmentSessionId: text (FK treatment_sessions, NOT NULL)

  amountCents: integer (NOT NULL) // Amount allocated to this session
}
```

### Indexes

- `payments`: (organizationId, patientId, paidOn), (organizationId, type)
- `payment_session_items`: (paymentId), (treatmentSessionId)

## API Design

### POST /payments

Creates payment, deposit, credit_usage, or refund. Returns payment with receipt number.

**Request:**

```typescript
{
  patientId: string
  amountCents: number
  type: 'payment' | 'deposit' | 'credit_usage' | 'refund'
  method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'other'
  notes?: string
  paidOn: string (YYYY-MM-DD)
  sessionItems?: Array<{
    treatmentSessionId: string
    amountCents: number
  }>
}
```

**Validation:**

- `payment` and `credit_usage` types require sessionItems with sum = amountCents
- Deposit type: no sessionItems (must be empty array)
- Refund type: no sessionItems (refunds apply to unused deposit credit, not sessions)
- Credit usage: check sufficient credit balance first

**Response:**

```typescript
{
  payment: Payment
  receiptNumber: string
}
```

### POST /payments/:id/void

Void a payment. Sets voidedAt/voidedById. Caller creates correcting entry if needed.

### GET /payments/:id/receipt

Render HTML receipt from payment record.

### GET /patients/:id/balance

Return current credit balance: `SUM(deposit) - SUM(credit_usage)` for non-voided payments.

## Risks / Trade-offs

### Risk: Concurrent receipt number generation

**Issue:** Multiple payments created simultaneously could generate duplicate receipt numbers if not handled atomically.

**Mitigation:** Wrap number generation in DB transaction: read counter, increment, write back. Use optimistic locking if needed.

### Risk: Balance calculation performance

**Issue:** Querying `SUM(deposit) - SUM(credit_usage)` on large payment history could be slow.

**Mitigation:**

- Indexes on (organizationId, patientId, type)
- Consider materialized view if performance issues emerge
- For now: assume reasonable payment volume (<10K per patient)

### Risk: Voided payments in balance calculation

**Issue:** Must ensure voided payments are excluded from balance calculation.

**Mitigation:** Always filter `WHERE voidedAt IS NULL` in balance queries. Enforce at application layer.

### Trade-off: No session.billed field

**Impact:** Cannot query "billed sessions" with simple index scan. Must join payment_session_items.

**Rationale:** Simplicity and single source of truth. If performance issues arise, consider computed column or materialized view.

### Trade-off: Receipt HTML rendering

**Impact:** No PDF generation yet. Receipts are HTML for print/download.

**Rationale:** Simple for MVP. Can add PDF (jsPDF) later without schema changes.

## Migration Plan

### Phase 1: Schema changes

1. Create `payments` table with indexes
2. Create `payment_session_items` table with indexes
3. Update `treatment_sessions`: remove `billed` column
4. Update `organizations.fiscal` JSON schema: add receipt config
5. Create DB view `patient_credit_balances` for convenience

### Phase 2: Data migration

Since project is in active development with seeded data only:

- No migration script needed
- Update seed data to include new fields
- Reseed database after schema updates

### Phase 3: API implementation

1. Implement POST /payments endpoint with validation
2. Implement POST /payments/:id/void endpoint
3. Implement GET /payments/:id/receipt endpoint
4. Implement GET /patients/:id/balance endpoint
5. Add helper: generateReceiptNumber() (transactional)

### Phase 4: UI implementation

1. Create Payment Card component for Treatment Session Slideover
2. Implement transaction type selector (payment/deposit/refund)
3. Add amount input with credit balance button
4. Add payment method dropdown
5. Implement receipt rendering component
6. Update session list to show payment status (derived)

### Phase 5: Integration

1. Wire Payment Card to /payments endpoint
2. Update session completion flow to show payment option
3. Add receipt download button
4. Test void/correction workflow

## Open Questions

1. **Receipt format:** Should we support both HTML and PDF? PDF requires jsPDF but better for archival.
   - **Decision:** HTML for MVP, PDF in future iteration

2. **Payment history view:** Should we create a dedicated payments list page?
   - **Decision:** Not in scope. Payment history available via patient view and session details.

3. **Credit balance display:** Where should patient credit balance be visible?
   - **Decision:** Patient profile page and session slideover (Payment Card)

4. **Refund workflow:** RESOLVED - Refunds apply to unused deposit credit only, not to session payments. Session payments are corrected by voiding, not refunding. Refunds have no sessionItems link.
