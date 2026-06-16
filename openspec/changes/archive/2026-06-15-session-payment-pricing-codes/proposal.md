## Why

Appointments (sessions) currently use a free-input `priceCents` integer field with no link to the organization's pricing catalog. The treatment plan was recently fixed to select pricing codes from the org catalog (with price item snapshots), but this pricing does not flow down to appointments. Therapists must manually type any amount, leading to inconsistency, errors, and no audit trail for which price code was applied. Payments then reference these arbitrary amounts, making it impossible to know what service was billed.

## What Changes

- Add a `priceItem` JSON column on the `appointments` table to snapshot the selected pricing code (code, description, rateCent) — mirrors the treatment plan pattern
- Auto-populate `priceCents` on appointment creation from the linked treatment plan's pricing (keyed by appointment location), or from the org default price item if no plan is linked
- Replace the free-input price override (`PATCH /appointments/[id]/price` with raw `priceCents`) with a pricing code selector that requires choosing an org-defined price item
- The price selector on sessions SHALL allow choosing any price item from the org's pricing catalog (not just the plan's item) — this is the override mechanism
- When a price item is selected on a session, both `priceItem` snapshot and `priceCents` (derived from the selected item's rate for the session's location) are persisted
- Payment UI and receipt rendering SHALL display the pricing code description alongside the amount, improving traceability

## Capabilities

### New Capabilities

- `session-pricing`: Pricing code selection and auto-population on appointments/sessions — covers the price item snapshot column, auto-fill from plan/org on creation, price item selector UI for override, and the updated PATCH price endpoint

### Modified Capabilities

- `unified-appointment-session`: Add `priceItem` JSON column, change price update from free-input to pricing-code-based, update the "Price and Extend on Appointment" requirement
- `payment-tracking`: Display pricing code description on billing cards, payment history, and receipts

## Impact

- **Database**: Add nullable `price_item` JSON column to `appointments` table (Drizzle migration)
- **API**: `POST /api/appointments` auto-populates `priceCents` + `priceItem` from plan/org default. `PATCH /api/appointments/[id]/price` accepts `priceItemCode` instead of raw `priceCents`, resolves to a price item snapshot, and derives `priceCents` from location
- **Types**: `AppointmentCreate` / `AppointmentDetail` shared types gain `priceItem` field. `UpdatePriceAction` changes from `{ priceCents }` to `{ priceItemCode: string }`
- **Frontend**: Price override UI on session becomes a `USelectMenu` of org pricing codes instead of a free number input; billing cards show pricing code label
- **Tenant boundary**: price items are org-scoped; the selector only shows items from the active organization's pricing config
- **No breaking changes for existing data**: appointments without `priceItem` (existing rows) continue to work with their existing `priceCents`
