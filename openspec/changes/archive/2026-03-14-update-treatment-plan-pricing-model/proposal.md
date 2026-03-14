# Change: Update Treatment Plan Pricing Data Model

## Why

The current data model uses individual override fields and a fallback-to-org-default approach, which creates unpredictable behavior when org prices change. Inheriting org prices at plan creation provides predictable, fixed pricing per plan that's better for insurance billing and historical reporting.

## What Changes

- **BREAKING**: Replace individual override fields with a single `pricing` JSON object
- Change inheritance behavior from "override fallback to org" to "inherit at creation, override anytime"
- Change data structure from flat optional fields to required nested object:
  - Old: `sessionCostClinicOverride`, `sessionCostHomeOverride`, `sessionCostTelehealthOverride` (all optional, null means use org)
  - New: `pricing: { clinic: number, home: number, telehealth: number }` (always populated, min 100 each)
- Add `pricing` JSON field to treatment_plan schema as required (not null)
- Update validation: pricing values must be >= 100 (minimum 100 cents)
- Auto-populate pricing from org defaults when creating treatment plans
- Use existing POST /api/treatment-plans and PATCH /api/treatment-plans/{id} endpoints (no dedicated pricing routes)
- Update session cost calculation logic
- Add pricing fields to TreatmentPlanCreateSlideover.vue component

## Impact

- Affected specs:
  - MODIFIED: treatment-plan (pricing data model, inheritance behavior)
- Affected code:
  - server/database/schema/treatment-plan.ts (update pricing field, make required)
  - shared/types/treatment-plan.ts (update type schemas, make pricing required)
  - server/api/treatment-plans/index.post.ts (auto-populate pricing from org)
  - server/api/treatment-plans/[id].put.ts (accept pricing in update)
  - app/components/treatment-plan/TreatmentPlanCreateSlideover.vue (add pricing UI fields)
  - Any code that calculates session costs (simplify to use plan pricing only)
  - Any code referencing the old individual fields or fallback logic
