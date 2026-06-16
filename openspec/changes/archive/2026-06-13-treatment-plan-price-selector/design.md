## Context

Treatment plans currently auto-fill pricing from the organization's default price item only. The form in `TreatmentPlanCreateSlideover.vue` reads `activeOrganization.data.pricing.priceItems`, finds the default (or first) item, and populates three `UInputNumber` fields for clinic/home/telehealth rates. Organizations that manage multiple price items (e.g., "Tarif de séance", "Suivi post-opératoire") have no way to select a specific item at plan creation time.

## Goals / Non-Goals

**Goals:**
- Allow users to pick any org price item to set treatment plan pricing
- Cache the full price item snapshot on the plan so org price changes don't retroactively affect existing plans
- Pricing is strictly defined by the selected price item — no manual editing allowed
- Only explicit selector changes update the cached snapshot

**Non-Goals:**
- Linking `priceItemCode` to invoicing logic (future change)
- Changing how session cost calculation works (pricing cents remain the source of truth)
- Modifying the price items management UI

## Decisions

### 1. Add `priceItem` JSON column to `treatment_plans` table

**Choice:** Nullable JSON column (`price_item TEXT NULL`) storing the full price item snapshot: `{ code, description, rateCent: { clinic, home, telehealth } }`. Added via Drizzle migration.

**Rationale:** Caching the full item decouples plan pricing from org price changes. The snapshot is immutable until the user explicitly selects a different item. The existing `pricing` column continues to hold the same values for backward compatibility and session cost calculation.

**Alternative considered:** Storing only `priceItemCode` and always reading rates from the org — rejected because org price changes would silently affect existing plans without user action.

### 2. Selector UX: USelectMenu with read-only pricing display

**Choice:** A single `USelectMenu` dropdown placed above read-only pricing fields within the "Tarifs des séances" `AppCard`. Items display as `{code} — {description}`. Selecting an item updates the displayed rates. The pricing fields use plain text (or disabled inputs) — users cannot manually edit them.

**Rationale:** Enforces that pricing comes only from predefined price items, eliminating manual entry errors and ensuring consistency with organization-defined rates.

### 3. Form state caches full PriceItem, derives pricing from it

**Choice:** Add `priceItem: PriceItem | null` to the form state. On selection, store the full org price item object. Pricing fields are read-only and derived from `formState.priceItem.rateCent`.

**Rationale:** The form submits the full `priceItem` snapshot to the API, which stores it directly. Pricing is always derived from the snapshot — no separate pricing state needed for display.

### 4. Edit mode: load cached snapshot, preserve on no change

**Choice:** When editing an existing plan with a cached `priceItem`, pre-select that item's code in the dropdown and display its cached rates. If the user doesn't change the selector, the original snapshot is kept. If the user selects a different item, the snapshot is replaced with the current org item data.

**Rationale:** Ensures org price item rate changes don't silently propagate to existing plans. The plan only gets new rates when the user takes explicit action.

## Risks / Trade-offs

- **[Stale cached snapshot]** → The cached `priceItem` rates become stale if the org updates its item but the plan isn't re-edited. This is by design: only explicit user action updates the snapshot. Display can show a visual indicator when cached rates differ from current org rates (future enhancement).
- **[Org admins need flexibility]** → If an org needs custom pricing for a specific plan, they must first create a matching price item in their org settings. Mitigation: price items are easy to create from the org settings page.
