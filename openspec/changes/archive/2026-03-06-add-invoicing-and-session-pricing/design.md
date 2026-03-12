# Design: Invoicing and Session Pricing

## Context

Physiotherapists need two primary billing workflows:

1. **Immediate payment**: Patient pays after session, therapist marks as paid and provides simple receipt
2. **Insurance invoicing**: Multiple sessions grouped into formal invoice for insurance reimbursement, sessions should relate to the same treatment plan

Current system only has basic billing fields on treatment sessions (cost, billed, insuranceClaimed) but lacks:

- Invoice entity and management
- Pricing configuration at organization level with treatment plan overrides
- Cost inheritance system
- Invoice numbering and document generation

## Goals / Non-Goals

### Goals

- Support immediate session billing with receipt generation
- Support multi-session invoice creation for insurance claims, grouping sessions that relate to the same treatment plan
- Flexible pricing system with org → plan → session inheritance
- Location-based pricing (cabinet/domicile/téléconsultation)
- Configurable invoice numbering (PREFIX-YEAR-COUNTER format)
- Simple invoice status (paid/unpaid only)

### Non-Goals

- Complex payment gateway integration (will be future work)
- Automated insurance claim submission (manual process for now)
- Invoice email sending (download/print only for now)
- Multi-currency support (Moroccan Dirham - Dh only for now)
- Invoice payment tracking beyond paid/unpaid
- Advanced invoice templates/styling (simple layout for now, future iteration)

## Decisions

### Decision 1: Separate Invoices and Receipts

**What**: Invoices are for insurance/multiple sessions, receipts are for immediate single-session payments.

**Why**: Different use cases require different documents and workflows. Invoices need to group sessions, receipts are simple transaction records.

**Alternatives considered**:

- Single invoice entity with a "type" field (too complex, different data structures)
- Use only invoices and mark them as paid immediately (confusing for insurance claims)

### Decision 2: Cost Inheritance Chain

**What**: Cost calculation follows: session.override → treatmentPlan.override(location) → organization.default(location)

**Why**: Provides flexibility while maintaining sensible defaults. Allows org-wide pricing, plan-specific adjustments, and session-level exceptions.

**Alternatives considered**:

- Only session-level cost (too manual, no defaults)
- Only organization-level cost (no plan or session flexibility)
- Direct database inheritance (no, application-level logic allows easier changes)

### Decision 3: Location-Based Pricing

**What**: Pricing defined per location type: clinic, home, telehealth

**Why**: Different locations have different costs (home visits require travel time, téléconsultation has lower overhead).

**Alternatives considered**:

- Single price regardless of location (doesn't match real-world practices)
- Price per room (too granular, rooms can be assigned different types)

### Decision 4: Invoice Numbering Format

**What**: {prefix}-{YYYY}-{counter} with prefix configurable, counter resets annually per org

**Why**: Standard Moroccan invoice numbering format, compliant with regulations, easy to configure.

**Alternatives considered**:

- Sequential only (prefix-0001, prefix-0002): No year separation
- Fully custom format: Too complex for initial implementation
- Auto-increment without year: Harder to track invoices per fiscal year

### Decision 5: Simple Invoice Status

**What**: Only paid/unpaid boolean, no complex state machine

**Why**: Minimizes complexity for initial release. Most Moroccan physiotherapists track simple paid/unpaid.

**Alternatives considered**:

- Full state machine (draft, sent, viewed, overdue, paid, cancelled): Overkill for now
- Status with payment dates: More tracking than needed initially

### Decision 6: Organization-Level Invoice Customization

**What**: Store organization info, invoice notes/terms, signature in organization.metadata as JSON

**Why**: Flexible storage for invoice customization without schema changes. Easy to extend.

**Alternatives considered**:

- Separate tables for invoice settings: Over-normalized for simple configuration
- Hardcoded values: No flexibility

### Decision 7: Client-Side PDF Generation

**What**: PDF documents (invoices and receipts) are generated on the client side using jsPDF library, not server-side.

**Why**: Keeps implementation simple, avoids complexity of PDF generation on edge workers (Cloudflare). Client-side is sufficient for current requirements.

**Alternatives considered**:

- Server-side PDF generation: Too complex on Cloudflare Workers
- Third-party PDF service: Unnecessary cost for current simple needs

### Decision 8: On-Demand Receipt Generation

**What**: Receipts are generated on-demand when needed, not stored in the database.

**Why**: Receipts are simple transaction records that don't need persistent storage. Session billing data already exists in database, can regenerate receipt anytime.

**Alternatives considered**:

- Store receipts in database: Unnecessary overhead, duplicates session data
- Store as files: Adds storage management complexity

### Decision 9: Simple Invoice Templates

**What**: Invoice layout and styling are kept simple for initial implementation. Only basic customization (organization info, notes, signature) is supported. Advanced templates/styling deferred to future iteration.

**Why**: Minimizes initial complexity. Basic layout covers immediate needs. Can iterate based on user feedback.

**Alternatives considered**:

- Full template system: Overkill for MVP
- Multiple invoice styles: Unclear requirements yet
- Custom CSS editing: Too complex for first release

## Data Model

### Invoices Table

```typescript
invoices {
  id: string (UUID)
  organizationId: string (FK → organizations)
  patientId: string (FK → patients)
  invoiceNumber: string (unique per org, format: PREFIX-YYYY-COUNTER)
  status: 'paid' | 'unpaid'
  issueDate: string (YYYY-MM-DD)
  dueDate: string (YYYY-MM-DD, nullable)
  totalAmount: integer (cents)
  paidAmount: integer (cents, default 0)
  notes: text (default invoice terms)
  signature: text (therapist signature)
  organizationInfo: JSON (name, address, RC, ICE, IF, etc.)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Note**: All monetary values are stored in cents (integer) for precision, but displayed in Moroccan Dirhams (Dh) with 2 decimal places in the UI and documents (e.g., 5000 cents = 50.00 Dh).

### Invoice Items Table

```typescript
invoice_items {
  id: string (UUID)
  invoiceId: string (FK → invoices)
  treatmentSessionId: string (FK → treatment_sessions)
  description: text (e.g., "Séance kinésithérapie - Cabinet")
  quantity: integer (default 1)
  unitPrice: integer (cents)
  amount: integer (cents, = quantity * unitPrice)
  createdAt: timestamp
}
```

### Organization Pricing Fields

```typescript
organizations {
  // ... existing fields ...

  // Invoice numbering
  invoiceNumberPrefix: string (default 'FAC')
  invoiceNumberYearBased: boolean (default true)
  invoiceNumberCounter: integer (default 0)

  // Pricing defaults (cents)
  defaultSessionCostClinic: integer
  defaultSessionCostHome: integer
  defaultSessionCostTelehealth: integer
}
```

### Treatment Plan Pricing Fields

```typescript
treatment_plans {
  // ... existing fields ...

  // Optional pricing overrides (nullable, cents)
  sessionCostClinicOverride: integer
  sessionCostHomeOverride: integer
  sessionCostTelehealthOverride: integer
}
```

### Treatment Session Pricing Override

```typescript
treatment_sessions {
  // ... existing fields ...

  // Override final cost (nullable, cents)
  costOverride: integer
}
```

**Note**: Moroccan business identifiers stored in organizationInfo:

- **RC** (Registre de Commerce): Commercial registration number
- **ICE** (Identifiant Commun de l'Entreprise): Common company identifier
- **IF** (Identifiant Fiscal): Tax identification number

## Pricing Inheritance Algorithm

```typescript
function calculateSessionCost(session, org, treatmentPlan) {
  const location = session.appointment.location // 'clinic' | 'home' | 'telehealth'

  // 1. Session override takes priority
  if (session.costOverride !== null) {
    return session.costOverride
  }

  // 2. Treatment plan override (if exists for this location)
  if (treatmentPlan) {
    const overrideField = `sessionCost${capitalize(location)}Override`
    if (treatmentPlan[overrideField] !== null) {
      return treatmentPlan[overrideField]
    }
  }

  // 3. Organization default (always required)
  const defaultField = `defaultSessionCost${capitalize(location)}`
  return org[defaultField]
}
```

## Invoice Numbering Algorithm

```typescript
function generateInvoiceNumber(org, transaction) {
  const prefix = org.invoiceNumberPrefix || 'FAC'
  const year = new Date().getFullYear()

  if (org.invoiceNumberYearBased) {
    // Year-based: FAC-2026-001
    // Check if counter needs reset (new year)
    const lastInvoiceYear = getLastInvoiceYear(org.id)
    if (lastInvoiceYear !== year) {
      org.invoiceNumberCounter = 0
    }
  }

  // Increment counter
  org.invoiceNumberCounter = (org.invoiceNumberCounter || 0) + 1

  // Format with leading zeros (min 3 digits)
  const counter = String(org.invoiceNumberCounter).padStart(3, '0')

  return `${prefix}-${year}-${counter}`
}
```

## API Endpoints

### Invoices

- `POST /api/invoices` - Create invoice with session IDs
- `GET /api/invoices/:id` - Get invoice with items
- `GET /api/invoices?patientId=&status=&from=&to=` - List invoices
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete (if not paid)
- `POST /api/invoices/:id/mark-paid` - Mark as paid
- `GET /api/invoices/:id/pdf` - Download PDF

### Receipts

- `POST /api/receipts` - Create receipt from session
- `GET /api/receipts/:id/pdf` - Download PDF

### Pricing

- `GET /api/treatment-sessions/:id/cost` - Get calculated cost with inheritance chain
- `GET /api/organizations/:id/pricing` - Get org pricing defaults
- `PATCH /api/organizations/:id/pricing` - Update pricing defaults
- `GET /api/treatment-plans/:id/pricing` - Get plan pricing overrides
- `PATCH /api/treatment-plans/:id/pricing` - Update pricing overrides

## UI Components

### BillingCard (Session Slideover)

- Shows calculated cost with inheritance breakdown
- "Payer immédiatement" button
- Cost override field for manual adjustments if needed
- "Ajouter à une facture" link

### InvoiceSlideover

- Patient selection
- Treatment plan selection (to group sessions for insurance reimbursement)
- Session selection (multi-select, filtered by selected treatment plan and unbilled status)
- Auto-calculate total
- Invoice notes/terms (pre-filled from org settings)
- Signature field
- Preview button

### InvoiceDocument

- Professional invoice layout
- Organization info header
- Patient details
- Session table (description, date, location, cost)
- Total calculation
- Payment status badge
- Terms/notes footer
- Signature line
- Download PDF button

### ReceiptDocument

- Simple transaction receipt
- Session details
- Amount paid
- Date
- Therapist signature
- Download PDF button

## Risks / Trade-offs

### Risk: Invoice Number Collisions

**Issue**: Concurrent invoice creation could generate duplicate numbers
**Mitigation**: Use database transaction to atomically increment counter and create invoice

### Risk: Price Changes Affecting Historical Sessions

**Issue**: Changing org pricing shouldn't affect existing session costs
**Mitigation**: Session cost is calculated at time of billing, stored in costOverride field

### Trade-off: Simple Invoice Status vs Full Lifecycle

**Decision**: Chose simple paid/unpaid to minimize complexity
**Risk**: Can't track sent, overdue, partial payments
**Future**: Can extend to full state machine if needed

### Risk: PDF Generation Complexity

**Issue**: PDF generation on edge workers (Cloudflare) is complex
**Decision**: Client-side PDF generation to keep it simple
**Mitigation**: Use client-side PDF library (jsPDF) for invoice and receipt generation

## Migration Plan

### Phase 1: Database Schema

1. Add new tables and columns to schema
2. Create migration script to populate default pricing for existing organizations
3. Add indexes and constraints

### Phase 2: Backend Logic

1. Implement pricing calculation functions
2. Implement invoice numbering logic
3. Create invoice/receipt API endpoints

### Phase 3: Frontend Components

1. Create invoice components
2. Integrate billing card into session slideover
3. Replace mock facturation page with real implementation

### Phase 4: Testing & Polish

1. Add comprehensive tests
2. Polish invoice PDF layout
3. Documentation

### Rollback

- Keep existing treatment session billing fields (cost, billed, insuranceClaimed)
- New features are additive, no breaking changes
- Can disable invoicing features without affecting session billing
