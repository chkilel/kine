# Change: Fix organization pricing storage to use cents

## Why

Organization pricing fields are currently stored "as is" (e.g., 150 for 150 MAD) but the spec requires storage in cents (15000 for 150 MAD). This misalignment between specification and implementation needs correction.

## What Changes

- Update pricing type definitions to accept cents but validate/display as currency units
- Implement conversion logic: multiply by 100 when saving, divide by 100 when displaying
- Update onboarding flow to handle cent conversion
- Update organization pricing settings UI to display currency correctly
- Update seed data to use cents format for pricing values

## Impact

- Affected specs: organization, onboarding
- Affected code:
  - `shared/types/org.types.ts` (pricing schema)
  - `app/pages/onboarding/index.vue` (onboarding pricing inputs)
  - `app/components/organization/PricingReservationsTab.vue` (pricing UI)
  - `server/api/organizations/index.post.ts` (organization creation)
  - `server/api/organizations/[id].put.ts` (organization update)
