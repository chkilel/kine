## 1. Database Migration

- [x] 1.1 Add nullable `price_item` JSON text column to `treatment_plans` table in Drizzle schema (`server/database/schema/treatment-plans.ts`)
- [x] 1.2 Generate and apply Drizzle migration (`pnpm db:gen` then `pnpm db:mig`)

## 2. Shared Types

- [x] 2.1 Add `priceItem` optional field (matching `PriceItem` type: `{ code, description, rateCent }`) to `TreatmentPlanCreate` and `TreatmentPlanUpdate` Zod schemas in `shared/types/treatment-plan.types.ts`
- [x] 2.2 Ensure the `TreatmentPlan` type auto-includes the new field (Drizzle select schema)

## 3. API Routes

- [x] 3.1 Update treatment plan create endpoint (`server/api/treatment-plans/index.post.ts`) to accept and persist `priceItem` snapshot, deriving `pricing` from `priceItem.rateCent`
- [x] 3.2 Update treatment plan update endpoint (`server/api/treatment-plans/[planId].patch.ts`) to accept and persist `priceItem` snapshot, updating `pricing` from `priceItem.rateCent`

## 4. Frontend — TreatmentPlanCreateSlideover

- [x] 4.1 Add `priceItem` (full `PriceItem | null`) to the form state, initialized from `treatmentPlan.priceItem` or the org default item
- [x] 4.2 Add a computed list of org price items for the selector from `activeOrganization.data.pricing.priceItems`
- [x] 4.3 Add a `USelectMenu` in the "Tarifs des séances" card for price item selection (label: `{code} — {description}`, value-key: `code`)
- [x] 4.4 Replace the three `UInputNumber` pricing fields with read-only display derived from `formState.priceItem.rateCent` (cents → DH)
- [x] 4.5 On selection change, store the full org price item object in `formState.priceItem` (snapshot)
- [x] 4.6 Update `handleSubmit` to send `priceItem` snapshot and derive `pricing` from its `rateCent`
- [x] 4.7 Update `resetForm` to reset `priceItem` to the org default item snapshot
