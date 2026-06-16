## Why

Currently, when creating or editing a treatment plan, pricing is auto-filled from the organization's default price item only. Organizations with multiple price items (e.g., "Consultation standard", "Suivi post-op", "Première visite") cannot select a specific item — they must manually overwrite the prices. This adds friction and increases the risk of pricing errors.

## What Changes

- Add a price item selector dropdown in the "Tarifs des séances" card of `TreatmentPlanCreateSlideover.vue`
- When a price item is selected, its rates are displayed as read-only clinic/home/telehealth fields (in DH)
- Default price item is pre-selected on creation; existing plan's pricing is preserved on edit
- Prices are NOT manually editable — users MUST choose from predefined price items only
- The existing three `UInputNumber` fields are replaced with a read-only display of the selected item's rates
- Cache the full selected price item snapshot (code, description, rates) on the treatment plan — org price changes do NOT retroactively affect existing plans
- On edit, the plan shows its cached pricing; changing the selector explicitly updates the snapshot

## Capabilities

### New Capabilities

- `price-item-selector`: Price item selection UI component in treatment plan form

### Modified Capabilities

- `treatment-plan`: Add `priceItem` JSON column caching the full price item snapshot (code, description, rates) on the plan
- `price-items`: No spec-level changes (price items data model stays the same)

## Impact

- **Frontend**: `TreatmentPlanCreateSlideover.vue` gains a `USelectMenu` for price items + read-only pricing display driven by selection
- **Database**: Add nullable `price_item` JSON column to `treatment_plans` table (Drizzle migration)
- **Types**: `TreatmentPlanCreate` / `TreatmentPlanUpdate` / `TreatmentPlan` shared types gain optional `priceItem` field with `PriceItem` shape (code, description, rateCent)
- **API**: Create/update treatment plan endpoints accept and persist `priceItem` snapshot
- **No breaking changes**: existing plans without `priceItem` continue to work with their existing `pricing` field; `priceItem` is optional
- **Tenant boundary**: price items are org-scoped; the selector only shows items from the active organization's pricing config
