## Context

The billing page and 5 overlay components were built with static mock data in `implement-payment-management-ui`. Backend APIs for payment creation, voiding, and receipts exist and are proven via `PaymentCard.vue` and `PaymentSummaryCard.vue`. This change wires the billing UI to those APIs and adds the one missing endpoint: listing payments by patient.

## Goals / Non-Goals

**Goals:**

- Replace all mock data in billing page and overlays with real API data
- Add `GET /api/patients/:id/payments` endpoint for payment history listing
- Enhance `GET /api/treatment-sessions` to include per-session payment status when queried by patient
- Wire all 5 overlays to real mutations/queries
- Ensure cache invalidation after mutations (create payment, void payment)
- Pass pre-selected session context into overlays (e.g., RecordPaymentSlideover pre-checks a specific session)

**Non-Goals:**

- Changing existing API contracts (POST /payments, POST /payments/:id/void, etc.)
- Adding new payment types or business logic
- Pagination for payment history (use simple limit, defer pagination)
- Invoice generation or document management
- Real-time WebSocket updates

## Decisions

### 1. New endpoint: `GET /api/patients/:id/payments`

RESTful nested resource under patient. Query params: `type` (filter by payment type), `limit` (default 50), `includeVoided` (boolean, default false). Returns payments with their `payment_session_items` joined so the frontend can display session references.

**Rationale:** The existing `GET /treatment-sessions/:id/payments` gives payments for one session. The billing page needs the inverse: all payments for a patient. A patient-scoped endpoint follows RESTful conventions and avoids complex client-side joins.

### 2. Session payment status via enhanced sessions list

Add `includePaymentStatus=true` query param to existing `GET /api/treatment-sessions`. When enabled and `patientId` is provided, the response enriches each session with `paidCents` (net amount from non-voided payments) and `paymentStatus` (`unpaid`, `partial`, `paid`).

**Rationale:** Reuses existing endpoint rather than creating a new one. The billing page already needs sessions by patient; adding payment status avoids N+1 queries from the client. The query joins `payment_session_items` with `payments` (filtered by `voidedAt IS NULL`) and computes `SUM(CASE WHEN type='session_payment' THEN amountCents ELSE -amountCents END)` per session.

### 3. Composable architecture

Extend existing `usePayment.ts` with new composables:

- `usePatientPayments(patientId, filters?)` - wraps GET /api/patients/:id/payments
- `useVoidPayment()` - mutation wrapping POST /api/payments/:id/void
- `usePatientSessionsPaymentStatus(patientId)` - wraps enhanced GET /api/treatment-sessions

Keep `PAYMENT_KEYS` as the query key factory. Add `patientPayments: (patientId) => [...root, 'patient', patientId]` key.

**Rationale:** Follows existing composable patterns (shared via `createSharedComposable` for mutations, direct export for queries). Centralizes cache invalidation.

### 4. Single fetch + client-side filtering

The billing page fetches all patient sessions once with `includePaymentStatus=true`. The "Séances à facturer" filter bar groups sessions by treatment plan: "Toutes" (all), "Sans plan" (no treatment plan), and "Par plan" (one entry per plan, each with a session count badge). Filtering and financial summary calculations (billed, collected, remaining, recovery rate) are all computed client-side from the single fetch — no additional API calls when the user switches filters.

### 5. Overlay data flow

The `useBillingSlideover` composable already manages overlay open/close state. The slideovers will receive props for pre-selection context (e.g., pre-selected session IDs for RecordPaymentSlideover) but fetch their own data internally via composables.

**Rationale:** Self-contained overlays. The billing page passes minimal props (patientId, pre-selected IDs). Each slideover uses composables to fetch required data. After successful mutation, overlays close and the parent page data refreshes via query cache invalidation.

### 6. Cache invalidation strategy

After `useCreatePayment` success: invalidate `PAYMENT_KEYS.root` (already done) plus new patient payments key. After `useVoidPayment` success: invalidate `PAYMENT_KEYS.root` plus patient payments key plus affected session keys.

**Rationale:** Broad invalidation is simple and correct for the data volumes involved. No stale data risk.

## Risks / Trade-offs

- **Performance of includePaymentStatus**: The session list query with payment status join adds a subquery per session. Mitigation: D1 is SQLite; with typical patient session counts (<100), this is fast.
- **Two query approach for billing page**: The page needs both sessions-with-status and payment-history. These are separate API calls. Mitigation: both are keyed and cached; no flicker.
- **Overlay complexity**: 5 overlays now have real state management. Mitigation: each is self-contained; proven composable patterns.

## Open Questions

None.
