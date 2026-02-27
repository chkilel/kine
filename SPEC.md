# Invoicing System - Implementation Specification

## Summary

Build a flexible billing system with:

- Direct session payments (no invoice required)
- Multi-session invoices for insurance reimbursement
- JSON-based pricing per location type in organizations
- Session-level cost overrides
- Org-configurable invoice numbering
- Invoice status calculated from session payments

---

## Requirements

### User Stories

1. As a physiotherapist, I want to bill a session immediately after it finishes without creating an invoice
2. As a physiotherapist, I want to create invoices for multiple sessions for insurance reimbursement
3. As a physiotherapist, I want to set different prices for different session locations (cabinet, domicile, teleconsultation)
4. As a physiotherapist, the cost is inherited from org level -> treatement plan level -> session, I can overide treatement plan session cost and be inherited in session as well as I want to override the calculated cost for individual sessions
5. As a physiotherapist, I want to configure invoice numbering (prefix, year-based, etc.)

### Non-Functional Requirements

- Payments always link to sessions (source of truth)
- Invoices are passive documentation (for insurance reimbursement only)
- Direct payments auto-mark sessions as billed
- Invoice status calculated dynamically (based on session payment status)
- Org-level config for invoice prefix and default costs
- JSON storage for flexible pricing config

---

## Architecture

### Database Schema

#### New Tables

**invoices.ts**

```typescript
export const invoices = sqliteTable('invoices', {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text()
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  invoiceNumber: text().notNull().unique(),
  invoiceDate: calendarDateField().notNull(),
  dueDate: calendarDateField(),
  status: text().notNull(), // computed: draft, sent, paid, partial_paid, canceled
  totalAmountCents: integer().notNull(),
  currency: text().notNull().default('EUR'),
  notes: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull()
})
```

**payments.ts**

```typescript
export const payments = sqliteTable('payments', {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  treatmentSessionId: text()
    .notNull()
    .references(() => treatmentSessions.id, { onDelete: 'cascade' }),
  invoiceId: text().references(() => invoices.id, { onDelete: 'set null' }),
  amountCents: integer().notNull(),
  paymentMethod: text().notNull(), // card, cash, transfer, insurance, check
  paymentDate: calendarDateField().notNull(),
  reference: text(),
  notes: text(),
  createdAt: timestamp().notNull()
})
```

**payments.ts**

```typescript
export const payments = sqliteTable('payments', {
  id: text().primaryKey(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  treatmentSessionId: text()
    .notNull()
    .references(() => treatmentSessions.id, { onDelete: 'cascade' }),
  invoiceId: text().references(() => invoices.id, { onDelete: 'set null' }),
  amountCents: integer().notNull(),
  paymentMethod: text().notNull(), // card, cash, transfer, insurance, check
  paymentDate: calendarDateField().notNull(),
  reference: text(),
  notes: text(),
  createdAt: timestamp().notNull()
})
```

#### Schema Updates

**organizations.ts** - add:

```typescript
invoiceConfig: text({ mode: 'json' })
  .$type<{
    prefix: string
    yearBased: boolean
    defaultDueDays: number
  }>()
  .notNull()
  .default('{"prefix":"INV","yearBased":true,"defaultDueDays":30}'),

defaultSessionCosts: text({ mode: 'json' })
  .$type<{
    cabinet: number
    domicile: number
    teleconsultation: number
  }>()
  .notNull()
  .default('{"cabinet":4500,"domicile":5500,"teleconsultation":4000}')
```

**treatment_sessions.ts** - add:

```typescript
invoiceId: text().references(() => invoices.id, { onDelete: 'set null' }),
costCents: integer(), // Manual override or cost when invoiced
costOverrideNote: text(), // Reason for manual override
```

**treatment_plans.ts** - add:

```typescript
costOverrideCents: integer(), // Overrides location-based pricing
```

### Business Logic

#### Invoice Numbering

**Format:** `{prefix}-{year}-{sequence}` (e.g., "INV-2024-001", "CAB-2024-012")

**Configuration (JSON in organizations.invoiceConfig):**

```typescript
{
  prefix: "INV", // or "FAC", "KINE", etc.
  yearBased: true, // Include year in number
  defaultDueDays: 30 // Auto-calculate due date
}
```

#### Cost Storage Flows

**Flow 1: Direct Payment (No Invoice)**

```
1. Session finishes (status = 'finished')
2. User clicks "Enregistrer le paiement" in billing card
3. Calculate cost from hierarchy (cabinet/domicile/teleconsultation defaults)
4. Store cost in treatment_sessions.costCents
5. Create payment record (payment.invoiceId = null)
6. Update session.billed = today, session.status = 'completed'
7. treatment_sessions.invoiceId = null (not on any invoice yet)
```

**Flow 2: Add Paid Session to Invoice (Later)**

```
1. User creates invoice for already-paid sessions
2. Select session (already has costCents set from Flow 1)
3. Set treatment_sessions.invoiceId = invoice.id
4. No need to recalculate cost - use existing costCents
5. Invoice displays cost from treatment_sessions.costCents
6. Invoice status = 'paid' (payments already exist)
```

**Flow 3: Add Unpaid Session to Invoice**

```
1. Session finished but NOT billed yet (costCents = null)
2. User creates new invoice
3. Select session
4. Calculate cost from hierarchy
5. Store cost in treatment_sessions.costCents
6. Set treatment_sessions.invoiceId = invoice.id
7. Session remains 'finished' (not 'completed' until paid)
8. Invoice status = 'draft' or 'sent'
```

**Key Points:**

- `treatment_sessions.costCents` is set when billing (direct payment) OR invoicing
- Once set, cost persists even if pricing defaults change
- When adding already-invoiced session to another invoice, use existing costCents
- Cost is only recalculated if `costCents` is null

---

## API Endpoints

### Invoices

- `POST /api/invoices` - Create invoice with sessions
  - Body: `{ patientId, sessionIds, invoiceDate, notes }`
  - Auto-generates invoice number from org config
  - For each session:
    - If costCents already exists: Use it (e.g., already paid session)
    - If costCents is null: Calculate from hierarchy and store it
  - Sets treatment_sessions.invoiceId for each session
  - Calculates total from session costs (sum of costCents)
  - Returns invoice with sessions

- `PATCH /api/invoices/[id]` - Update invoice
  - Body: Partial invoice fields (notes, dueDate)
  - Returns updated invoice

- `DELETE /api/invoices/[id]` - Delete draft invoice
  - Only allows deleting draft status
  - Returns success message

- `PATCH /api/invoices/[id]/cancel` - Cancel invoice
  - Only allows canceling sent/paid/partial_paid invoices
  - Updates status to 'canceled'
  - Payments remain (immutable)

- `GET /api/invoices` - List invoices
  - Query params: `page`, `limit`, `patientId`, `status`, `invoiceDateFrom`, `invoiceDateTo`
  - Returns paginated list

- `GET /api/invoices/[id]` - Get invoice
  - Returns invoice with sessions + calculated status
  - Includes patient info

### Invoice Sessions

- `POST /api/invoices/[id]/sessions` - Add session(s) to invoice
  - Body: `{ sessionIds: string[] }`
  - For each session:
    - If costCents already exists: Use it (e.g., already paid session)
    - If costCents is null: Calculate from hierarchy and store it
  - Sets treatment_sessions.invoiceId = invoiceId
  - Updates invoice total
  - Returns updated sessions

- `DELETE /api/invoices/[id]/sessions/[sessionId]` - Remove session from invoice
  - Sets treatment_sessions.invoiceId = null
  - Updates invoice total
  - Returns success message

- `GET /api/invoices/[id]/sessions` - List sessions on invoice
  - Returns sessions with payment status

### Payments

- `POST /api/treatment-sessions/[id]/payments` - Record direct payment
  - Body: `{ amountCents, paymentMethod, paymentDate, reference, notes }`
  - Calculates cost from hierarchy (if costCents not already set)
  - Stores cost in treatment_sessions.costCents
  - Auto-marks session as billed
  - Updates session status to 'completed'
  - Returns payment record

- `PATCH /api/treatment-sessions/[id]/cost` - Update session cost override
  - Body: `{ costCents, note }`
  - Returns updated session

### Helper Endpoints

- `GET /api/patients/[id]/unbilled-sessions` - List finished, unbilled sessions
  - Returns sessions with calculated costs

- `GET /api/patients/[id]/payment-history` - List all payments for patient
  - Returns payments across all invoices

- `GET /api/treatment-sessions/[id]/cost` - Calculate session cost
  - Returns cost based on hierarchy

---

## UI Components

### Core Components

#### TreatmentSessionBillingCard.vue

**Location:** Inline in TreatmentSessionSlideover

**Features:**

- Shows when session status is 'finished'
- Displays calculated cost, duration, location
- Inline payment form (method, amount, date, reference)
- "Enregistrer le paiement" button
- Alternative buttons: "Créer une facture", "Ajouter à une facture"
- "Modifier le coût" button → opens CostOverrideModal
- Disabled state after payment: "✅ Payé le 22/02/2024"

#### InvoiceCreateModal.vue

**Features:**

- Patient auto-selected
- Session selector from unbilled list
- Invoice date, due date (optional), notes
- Auto-calculate total
- Preview invoice
- Create as draft

#### InvoiceViewModal.vue

**Features:**

- Invoice details (number, date, status, notes)
- Sessions table with payment status
- Total, paid, remaining
- "Marquer comme envoyée" button (if draft)
- "Annuler" button (if paid)
- Actions: Edit (if draft), Delete (if draft)

#### InvoiceAddToModal.vue

**Features:**

- List draft invoices
- Select invoice to add session to
- Adds session to selected invoice

#### CostOverrideModal.vue

**Features:**

- Enter new cost
- Enter reason (optional)
- Updates session.costCents and session.costOverrideNote

### Page Components

#### Patient Billing Tab (`/pages/patients/[id]/facturation.vue`)

**Sections:**

1. **Header Actions:**
   - "Nouvelle facture" button
   - Stats cards: Total due, Paid this month, Unbilled sessions

2. **Unbilled Sessions:**
   - Table of finished sessions not on any invoice
   - Checkbox selection → "Add to Invoice" button
   - Shows: Date, Duration, Location, Calculated Cost

3. **Recent Invoices:**
   - Table with invoice #, Date, Amount, Status, Paid Amount
   - Status badges: Draft, Sent, Paid, Partially Paid, Canceled
   - Actions: View, Print, Edit (if draft), Delete (if draft)

4. **Invoice Detail View:**
   - Invoice info (number, date, status, notes)
   - Sessions table
   - Payment history
   - "Add Payment" button
   - "Mark as Sent" button (if draft)

#### Organization Invoice Settings (`/pages/settings/facturation.vue`)

**Sections:**

1. **Invoice Config:**
   - Prefix input (INV, FAC, CAB...)
   - Year-based checkbox
   - Default due days
   - Preview of invoice number

2. **Session Costs:**
   - Cabinet cost
   - Domicile cost
   - Teleconsultation cost

---

## Workflows

### Workflow 1: Direct Session Payment (No Invoice)

1. Session finishes → Billing card appears in slideover
2. User fills payment form (method, amount, date, reference)
3. User clicks "Enregistrer le paiement"
4. API calculates cost (if not already set) and stores in treatment_sessions.costCents
5. API creates payment record (no invoiceId)
6. Session updates: `billed = today`, `status = 'completed'`
7. Billing card shows disabled: "✅ Payé le ..."

### Workflow 2: Create Invoice

1. Patient billing tab → "Nouvelle facture"
2. Invoice create modal opens
3. Select sessions from unbilled list
4. Set invoice date, notes
5. Save → Invoice created with auto-generated number
6. For each session:
   - If costCents already exists (e.g., already paid): Use it
   - If costCents is null: Calculate from hierarchy and store in treatment_sessions.costCents
7. Session invoiceId set
8. Status = 'draft'

### Workflow 3: Invoice for Already-Paid Sessions

1. Invoice create modal opens
2. Select paid sessions (shown with payment badge)
3. Save invoice
4. Session invoiceId set (costCents already stored from Workflow 1)
5. Invoice status = 'paid' immediately
6. Payments already linked to invoice

### Workflow 4: Cost Override

1. Billing card shows calculated cost
2. User clicks "Modifier le coût"
3. Cost override modal opens
4. Enter new cost + reason
5. Save → Session `costCents` updated with note

### Workflow 5: Cancel Invoice

1. Invoice view modal (paid invoice)
2. Click "Annuler"
3. Confirm
4. Invoice status = 'canceled'
5. Payments remain (immutable)
6. Session remains 'completed'

---

## Constants

### Invoice Statuses

```typescript
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'partial_paid', 'canceled'] as const

export const INVOICE_STATUS_CONFIG = {
  draft: { color: 'neutral', label: 'Brouillon', icon: 'i-hugeicons-file-02' },
  sent: { color: 'info', label: 'Envoyée', icon: 'i-hugeicons-send-01' },
  paid: { color: 'success', label: 'Payée', icon: 'i-hugeicons-checkmark-circle-02' },
  partial_paid: { color: 'warning', label: 'Partiellement payée', icon: 'i-hugeicons-payment-01' },
  canceled: { color: 'error', label: 'Annulée', icon: 'i-hugeicons-cancel-01' }
}
```

### Payment Methods

```typescript
export const PAYMENT_METHODS = ['card', 'cash', 'transfer', 'insurance', 'check'] as const

export const PAYMENT_METHOD_CONFIG = {
  card: { label: 'Carte', icon: 'i-hugeicons-credit-card' },
  cash: { label: 'Espèces', icon: 'i-hugeicons-money-01' },
  transfer: { label: 'Virement', icon: 'i-hugeicons-bank-transaction-01' },
  insurance: { label: 'Assurance', icon: 'i-hugeicons-shield-check-01' },
  check: { label: 'Chèque', icon: 'i-hugeicons-file-02' }
}
```

### Location Types

```typescript
export const LOCATION_TYPES = ['cabinet', 'domicile', 'teleconsultation'] as const

export const LOCATION_TYPE_CONFIG = {
  cabinet: { label: 'Cabinet', icon: 'i-hugeicons-building-01' },
  domicile: { label: 'Domicile', icon: 'i-hugeicons-home-01' },
  teleconsultation: { label: 'Téléconsultation', icon: 'i-hugeicons-video-call' }
}
```

---

## File Structure

### New Database Files

```
server/database/schema/
  - invoice.ts
  - payments.ts
```

server/database/schema/

- invoice.ts

```

### New API Files
```

server/api/

- invoices/
  - index.get.ts
  - index.post.ts
  - [id].get.ts
  - [id].patch.ts
  - [id].delete.ts
  - [id].cancel.patch.ts
  - [id]/sessions/
    - index.post.ts
    - [sessionId].delete.ts
- payments/
  - index.get.ts
- patients/
  - [id]/
    - unbilled-sessions.get.ts
    - payment-history.get.ts

```

server/api/

- invoices/
  - index.get.ts
  - index.post.ts
  - [id].get.ts
  - [id].patch.ts
  - [id].delete.ts
  - [id].cancel.patch.ts
  - [id]/sessions/
    - index.post.ts
    - [sessionId].delete.ts
- treatment-sessions/
  - [id]/
    - payments/
      - index.post.ts
    - cost.patch.ts
- patients/
  - [id]/
    - unbilled-sessions.get.ts
    - payment-history.get.ts

```

### New Type Files

```

shared/types/

- invoice.types.ts

```

### New Utility Files

```

shared/utils/

- constants.invoice.ts
  server/utils/
- invoice-number.ts
- session-cost.ts
- invoice-status.ts

```

### New Component Files

```

app/components/billing/

- TreatmentSessionBillingCard.vue
- InvoiceCreateModal.vue
- InvoiceViewModal.vue
- InvoiceAddToModal.vue
- CostOverrideModal.vue

```

### New Page Files

```

app/pages/settings/

- facturation.vue

```

### Modified Files

```

app/components/treatment-session/

- TreatmentSessionSlideover.vue (add billing card)
  app/pages/patients/
- [id]/facturation.vue (enhance with real data)

```

---

## Implementation Phases

### Phase 1: Database Setup

- [ ] Create invoice.ts schema file
- [ ] Create payments.ts schema file
- [ ] Update organizations.ts (add JSON config fields)
- [ ] Update treatment_sessions.ts (add invoiceId, costCents, costOverrideNote)
- [ ] Update treatment_plans.ts (add costOverrideCents)
- [ ] Generate and run database migration
- [ ] Test schema in database

### Phase 2: Core Business Logic

- [ ] Create `invoice-number.ts` utility
- [ ] Create `session-cost.ts` utility
- [ ] Create `invoice-status.ts` utility
- [ ] Add unit tests for calculation logic

### Phase 3: Type Definitions & Constants

- [ ] Create `invoice.types.ts` with all Zod schemas
- [ ] Create `constants.invoice.ts` with status/method configs
- [ ] Export all necessary types

### Phase 4: Direct Session Payment API

- [ ] Create `/api/treatment-sessions/[id]/payments/index.post.ts`
- [ ] Auto-update session.billed on payment
- [ ] Validate payment amount
- [ ] Create `/api/treatment-sessions/[id]/cost.patch.ts`

### Phase 5: Post-Session Billing UI

- [ ] Create `TreatmentSessionBillingCard.vue`
- [ ] Create `CostOverrideModal.vue`
- [ ] Update `TreatmentSessionSlideover.vue`
  - Import billing card
  - Show when session.status === 'finished'
  - Handle payment-saved event
  - Handle create-invoice event
  - Handle add-to-invoice event

### Phase 6: Invoice Management API

- [ ] Create `/api/invoices/index.get.ts`
- [ ] Create `/api/invoices/index.post.ts`
- [ ] Create `/api/invoices/[id].get.ts`
- [ ] Create `/api/invoices/[id].patch.ts`
- [ ] Create `/api/invoices/[id].delete.ts`
- [ ] Create `/api/invoices/[id].cancel.patch.ts`
- [ ] Create `/api/invoices/[id]/sessions/index.post.ts`
- [ ] Create `/api/invoices/[id]/sessions/[sessionId].delete.ts`

### Phase 7: Helper Endpoints

- [ ] Create `/api/patients/[id]/unbilled-sessions.get.ts`
- [ ] Create `/api/patients/[id]/payment-history.get.ts`
- [ ] Create `/api/treatment-sessions/[id]/cost.get.ts`

### Phase 8: Invoice UI Components

- [ ] Create `InvoiceCreateModal.vue`
- [ ] Create `InvoiceViewModal.vue`
- [ ] Create `InvoiceAddToModal.vue`

### Phase 9: Patient Billing Tab

- [ ] Enhance `/pages/patients/[id]/facturation.vue`
- [ ] Add stats cards
- [ ] Connect unbilled sessions list
- [ ] Connect invoices table
- [ ] Connect invoice view modal
- [ ] Add loading states

### Phase 10: Organization Settings

- [ ] Create `/pages/settings/facturation.vue`
- [ ] Add invoice config form
- [ ] Add session costs form
- [ ] Add invoice number preview
- [ ] Create `/api/organizations/current/invoice-config.patch.ts`

### Phase 11: Testing

- [ ] Test direct payment workflow
- [ ] Test invoice creation workflow
- [ ] Test cost override workflow
- [ ] Test invoice status calculation
- [ ] Test invoice cancellation
- [ ] Test organization settings
- [ ] Add error handling for edge cases

### Phase 12: Polish

- [ ] Add loading states
- [ ] Add success notifications
- [ ] Add error messages
- [ ] Improve accessibility
- [ ] Add keyboard shortcuts
- [ ] Optimize performance

---

## Validation Rules

### Invoice Creation

- Invoice number must be unique
- Invoice date must be provided
- At least one session must be added
- Sessions cannot be added to multiple invoices
- Total calculated from session costs

### Payment Recording

- Amount must be positive
- Payment method required
- Payment date required
- Cannot exceed session cost
- Auto-mark session as billed

### Cost Override

- Cost must be non-negative
- Note optional but recommended
- Overrides calculated hierarchy

### Invoice Deletion

- Only draft invoices can be deleted
- Paid invoices cannot be deleted (use cancel instead)

### Invoice Cancellation

- Draft invoices cannot be canceled (use delete instead)
- Sent/paid/partial_paid invoices can be canceled
- Payments remain immutable

---

## Edge Cases

### Session with cost override added to invoice

- Use session.costCents instead of calculated cost
- If costCents already exists, use it (don't recalculate)
- Display note in invoice if needed

### Payment before invoice exists

- Payment has invoiceId = null
- Cost stored in treatment_sessions.costCents during payment
- Later create invoice and link payment
- Invoice uses existing costCents from session
- Invoice status calculates correctly

### Partial payments on session

- Sum all payments for session
- Compare to invoice session cost
- Update invoice status accordingly

### Invoice with all sessions paid before creation

- Invoice status = 'paid' immediately
- Already-paid sessions display payment info

### Organization config missing or invalid

- Use default values for invoice numbering
- Use default costs (45/55/40) for sessions

### Session cost calculated as 0

- Show error or warning
- Require cost override before billing

### Session already on another invoice

- Prevent adding to new invoice
- Show error message

---

## Future Enhancements

### Potential Future Features

- PDF invoice generation
- Email invoice sending
- Invoice templates
- Tax/VAT calculation
- Multi-currency support
- Payment reminders
- Insurance claim tracking
- Refund support
- Payment plan support
- Recurring invoices
- Invoice dashboard/analytics

### Scalability Considerations

- Pagination for large invoice lists
- Indexing for performance
- Caching for invoice status calculation
- Batch operations for bulk billing

---

## Notes

### Design Decisions

1. **No session_pricing table** - Using JSON in organizations for simplicity
2. **No invoice_sessions table** - Using invoiceId in treatment_sessions for simplicity
3. **Cost stored in treatment_sessions** - When added to invoice, cost is calculated and stored to preserve historical pricing
4. **Payments always link to sessions** - Source of truth for billing
5. **Invoices are documentation** - For insurance reimbursement
6. **Invoice status calculated** - Not stored in database
7. **Org-level config** - Flexible prefix and pricing per organization
8. **JSON config** - Easy to extend without schema changes

### Tech Stack Alignment

- Follows existing Nuxt 4 patterns
- Uses @nuxt/ui components
- Uses Drizzle ORM for database
- Uses Zod for validation
- Uses Pinia for state management
- French language matching existing app

### Code Quality

- Follow existing code style
- Maintain consistency with current patterns
- Use existing utilities (toast, error handling)
- Proper TypeScript typing
- Component composition

---

## Questions for Review

1. Should invoices support partial payments per session? (Currently: sum all payments for session)
2. Should we track payment history for invoices separately from sessions?
3. Should invoice status be stored in database or always calculated?
4. Should there be a "Print" button to generate PDF invoices?
5. Should we support sending invoices via email?
6. Should there be a global invoices dashboard for the organization?
7. Should we support bulk operations (e.g., invoice all unbilled sessions)?
8. Should we track who created/updated invoices (audit trail)?

```

```
