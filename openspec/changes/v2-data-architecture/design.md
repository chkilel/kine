## Context

KineDesk is a multi-tenant physiotherapy practice management SaaS for Morocco. The V1 data layer was built incrementally and has fundamental gaps (no invoices, split appointment/session model, insufficient insurance billing). We are starting a **fresh project** with the same tech stack — no migration from V1. This is a clean-slate V2 data architecture informed by domain research (Jane App patterns, Morocco convention billing) and lessons from V1.

**Tech stack constraints:**

- Cloudflare D1 (SQLite) — no SEQUENCE support, no stored procedures, 10MB default DB limit (can be increased)
- Cloudflare Workers — 30s CPU limit, no filesystem, no long-running processes
- Drizzle ORM — SQLite dialect, `defineRelations` for joins
- better-auth — manages auth tables (users, sessions, organizations, members, invitations, teams, team_members). We reference but never modify these.

**Domain constraints (Morocco):**

- Insurance is convention-based — coverage is a therapist-insurer attribute, NOT a patient-policy attribute
- Two invoice types: convention (therapist→insurer, co-pay tracking) and remboursement (therapist→patient, end-of-treatment document)
- All financial records must be immutable — never UPDATE amounts, only INSERT compensating records

## Goals / Non-Goals

**Goals:**

- Complete schema for 26 tables (9 auth + 17 domain) from scratch
- Merged appointment model eliminating V1's synchronization bugs
- Full invoice + credit note system with immutable ledger pattern
- Morocco-specific insurance convention model with co-pay tracking
- Payment-to-invoice-to-appointment full traceability
- Cloudflare-optimized sequential numbering (KV/DO)
- All enums and types in `shared/types/` ready for frontend consumption
- Drizzle relations file enabling efficient JOINs for common query patterns

**Non-Goals:**

- Migration from V1 (fresh project)
- API routes, composables, or UI changes (this change is schema-only)
- Waitlist functionality
- Patient insurance policies table
- Package UI (schema only for packages)
- PDF generation implementation (schema supports it, generation is separate)
- Real-time features or WebSocket subscriptions

## Decisions

### 1. Single `invoices` table with `type` discriminator

**Decision**: One `invoices` table with `type: 'convention' | 'remboursement'` instead of separate tables.

**Rationale**: Both types share 80% of columns (status, dates, totals, org FK). Application-level constraints enforce type-specific rules (remboursement invoices always have `insuranceCompanyId = NULL`, convention invoices require it). Alternative of two tables would duplicate schema and complicate cross-type queries.

**Alternative considered**: Separate `convention_invoices` and `remboursement_invoices` tables — rejected due to schema duplication and shared query patterns (list all invoices for a patient, dashboard totals).

### 2. `payment_allocations` junction table

**Decision**: A `payment_allocations` table linking payments to BOTH invoices and appointments, with a `portion` field (`full` | `copay` | `insurance`).

**Rationale**: Industry standard (Jane, SimplePractice, Kareo) requires direct payment↔invoice linking. The original V1 design of payment→session→invoice (no direct invoice link) is a market anti-pattern. The `portion` field enables tracking co-pay splits — one payment can have multiple allocations (e.g., $50 copay to appointment X, $150 insurance portion to appointment X via invoice Y).

**Alternative considered**: Simple FK from payments to invoices — rejected because a single payment can cover multiple invoices (partial payments, overpayments).

### 3. Insurance context inheritance from `treatment_plans`

**Decision**: `treatment_plans.insuranceCompanyId` is the source of truth. `appointments.insuranceCompanyId` and `invoices.insuranceCompanyId` are inherited (denormalized) at creation time.

**Rationale**: Appointments and invoices need to know their insurance context for fast filtering and historical accuracy. If insurance context only lived on treatment_plans, every appointment/invoice query would require a JOIN. Denormalization at creation time locks the context (insurance companies can change conventions).

**Alternative considered**: Always JOIN to treatment_plans for insurance context — rejected for query performance and historical accuracy (what if the plan's insurance changes mid-treatment?).

### 4. Merged appointment + treatment_session

**Decision**: Single `appointments` table absorbing all treatment_session fields, with unified state machine: `scheduled → confirmed → in_progress → finished → completed / cancelled / no_show`.

**Rationale**: V1's split model created two state machines that must stay in sync, producing 4+ identified bug scenarios. Jane App uses a merged model successfully with 200k+ practitioners. The state machine gates which field groups are editable:

- `scheduled/confirmed`: scheduling fields only
- `in_progress`: + clinical fields + timer
- `finished/completed`: + billing fields, notes locked
- `cancelled/no_show`: all fields frozen

**Alternative considered**: Keep separate tables with a service layer syncing state — rejected due to synchronization complexity and Jane App's proven merged approach.

### 5. Configurable services table

**Decision**: `services` table replaces hardcoded `VALID_APPOINTMENT_TYPES` enum.

**Rationale**: Solo practices and clinics need custom appointment types (e.g., "Bilan kiné", "Rééducation post-op", "Massage sportif"). A table allows org-scoped configuration with default duration and pricing, while still supporting a global default set seeded on org creation.

### 6. Cloudflare KV for sequential numbering

**Decision**: KV atomic counters for invoice/receipt numbering (one key per org per number type).

**Rationale**: D1 has no SEQUENCE or AUTO_INCREMENT per-org. KV's atomic `put` with conditional writes provides per-org sequential numbering. Format: `invoice_number:{orgId}` → `{lastNumber}`. Durable Objects are more robust but overkill for simple counters.

**Alternative considered**: Durable Objects with per-org counter — more robust but adds complexity. KV is simpler and sufficient for sequential numbering (non-cryptographic, can tolerate rare edge-case gaps).

**Alternative considered**: Store counter in `organizations` metadata — rejected due to race conditions with concurrent requests.

### 7. Immutable financial ledger

**Decision**: Never UPDATE amounts on payments, invoices, or credit notes. Only INSERT compensating records.

**Rationale**: Audit trail integrity for Moroccan insurance claims. If an invoice total is wrong, you issue a credit note and create a new invoice. If a payment amount is wrong, you create a refund payment and a new payment. This is standard accounting practice.

### 8. Pro-forma price locking at invoice creation

**Decision**: Convention invoices lock `pricePerSessionCents` at creation time in `invoice_line_items`. `invoice_appointments` stores `sessionNumber` only (no price). Remboursement invoices capture `priceCents` per appointment in `invoice_appointments` at attachment time.

**Rationale**: Convention invoices are pro-forma — the price per session is agreed with the insurer and must not change if the treatment plan's pricing changes later. Remboursement invoices are end-of-treatment patient documents where the price is captured at the time of invoice creation.

### 9. Denormalized `paymentStatus` on appointments

**Decision**: `appointments.paymentStatus` field (computed from payment_allocations) for fast list filtering.

**Rationale**: The `facturation.vue` page filters appointments by payment status. Without denormalization, every list query requires JOINs to payments → payment_allocations → invoices. The field is recomputed by a Queue consumer after payment events.

## Risks / Trade-offs

**[Denormalized insurance FK drift]** → If insurance company changes after appointments are created, historical appointments retain old FK. This is correct behavior (historical accuracy) but must be communicated in UI.

**[KV counter gaps]** → If a KV increment succeeds but invoice creation fails, there will be a gap in sequential numbering. Mitigation: Accept gaps (standard in invoicing systems), document gap tolerance.

**[Merged appointment table size]** → Single table holds more columns than V1's split approach. Mitigation: D1 handles this fine at typical clinic scale (<100k appointments per org). Index strategically on `orgId`, `patientId`, `status`, `date`.

**[Application-level invoice type constraints]** → No DB-level CHECK for "convention invoices must have insuranceCompanyId". Mitigation: Zod validation on API routes + service layer enforcement. Acceptable trade-off for schema simplicity.

**[Payment allocation complexity]** → `payment_allocations` with `portion` field is flexible but complex to query. Mitigation: Denormalized `paymentStatus` on appointments avoids most JOINs. Detailed allocation queries are rare (financial reports only).

**[Soft delete on financial records]** → Credit notes and payments use soft delete but amounts remain in totals calculations. Mitigation: All total-computing queries MUST exclude `deletedAt IS NOT NULL` records. Test thoroughly.
