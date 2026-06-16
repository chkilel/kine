## Context

Treatment plans were recently fixed to select pricing codes from the org's `pricing.priceItems` catalog and snapshot the selected item on the plan. However, appointments (sessions) still use a free-input `priceCents` integer with no link to pricing codes. The `calculateInheritedPrice()` utility in `server/utils/pricing.ts` exists but is not wired into any appointment API endpoint. The `PATCH /appointments/[id]/price` endpoint accepts a raw `priceCents` integer with no validation against the org catalog.

Current appointment schema has `priceCents` (integer, default 0) but no `priceItem` column. The treatment plan schema has both `pricing` (RateCent) and `priceItem` (full PriceItem snapshot) as the reference pattern.

## Goals / Non-Goals

**Goals:**
- Auto-populate `priceCents` and `priceItem` on appointment creation from treatment plan or org default
- Replace free-input price override with pricing code selection from org catalog
- Display pricing code descriptions on billing cards and receipts
- Maintain backward compatibility with existing appointments that have no `priceItem`

**Non-Goals:**
- Changing the payment recording flow (session_payment/session_refund logic stays the same)
- Adding new pricing code management UI (org pricing CRUD is already done)
- Changing the deposit/balance system
- Modifying treatment plan pricing (already fixed)

## Decisions

### 1. Add `priceItem` JSON column to appointments table (matching treatment plan pattern)

**Decision**: Add a nullable `price_item` TEXT (JSON) column storing `{ code, description, rateCent }` — same shape as `treatment_plans.price_item`.

**Rationale**: Mirrors the proven treatment plan pattern. The snapshot decouples sessions from future org price changes. Nullable to support existing appointments without a price item.

**Alternative considered**: Separate `appointment_pricing_codes` join table — rejected because pricing codes are already embedded in the org JSON and sessions need a point-in-time snapshot, not a live reference.

### 2. Change `PATCH /appointments/[id]/price` to accept `priceItemCode` instead of `priceCents`

**Decision**: The price override endpoint changes from `{ priceCents: number }` to `{ priceItemCode: string }`. The server resolves the code to a price item from the org's `pricing.priceItems`, snapshots it on the appointment, and derives `priceCents` from `rateCent[appointment.location]`.

**Rationale**: Enforces that all session prices correspond to defined pricing codes. The code string is a stable reference; the server resolves the full snapshot. Using the location from the appointment ensures correct per-location pricing.

**Alternative considered**: Accept full `priceItem` object from client — rejected because the client could forge arbitrary prices. Server-side resolution ensures the code exists in the org catalog.

### 3. Auto-populate pricing on appointment creation

**Decision**: When creating an appointment:
1. If it has a `treatmentPlanId` and the plan has a `priceItem`, use the plan's `priceItem` snapshot and derive `priceCents` from `rateCent[location]`
2. Else, use the org's default price item (first with `isDefault: true`, or first item) and derive `priceCents` similarly
3. If no pricing data exists, leave `priceItem` null and `priceCents` at 0

**Rationale**: Therapists should not have to manually set prices for every session. The treatment plan already defines the expected pricing; inheriting it eliminates manual work and errors.

### 4. Use existing `PriceItemSelector` component pattern for session price override

**Decision**: Reuse the `USelectMenu` pattern from the treatment plan price selector for the session price override UI. The component already exists and knows how to render org pricing codes.

**Rationale**: Consistency across the app. The same component (or a variant) used for treatment plan pricing selection should work for session price override.

## Risks / Trade-offs

**[Risk] Existing appointments without priceItem show no description on receipts/billing cards** → Mitigation: `priceItem` is nullable. UI gracefully handles null — falls back to showing amount only without a code label.

**[Risk] Changing PATCH /price from priceCents to priceItemCode is a breaking API change** → Mitigation: The endpoint is only called from the frontend session view. The frontend will be updated in the same change. No external consumers exist.

**[Risk] Location mismatch if appointment location changes after price is set** → Mitigation: When overriding price, the server uses the current appointment location. If location changes, the therapist must re-select the pricing code (priceCents stays from the previous selection until explicitly overridden).
