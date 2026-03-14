# Tasks

## 1. Update type definitions and validation

- [x] 1.1 Create utility functions for price conversion (`centsToCurrency`, `currencyToCents`)
- [x] 1.2 Update `orgPricingSchema` validation to work with cents in storage
- [x] 1.3 Update `onboardingSessionRatesSchema` validation to handle cent conversion
- [x] 1.4 Add helper composable or utility for displaying prices in UI

## 2. Update API endpoints

- [x] 2.1 Update `server/api/organizations/index.post.ts` to convert pricing to cents before saving
- [x] 2.2 Update `server/api/organizations/[id].put.ts` to convert pricing to cents before saving
- [x] 2.3 Ensure API responses return prices in cents (as per spec)

## 3. Update onboarding flow

- [x] 3.1 Update `app/pages/onboarding/index.vue` to handle pricing in currency units for display
- [x] 3.2 Convert pricing to cents before submission in onboarding
- [x] 3.3 Update default values to work with new conversion logic
- [x] 3.4 Update form validation to handle cent conversion

## 4. Update organization pricing UI

- [x] 4.1 Update `app/components/organization/PricingReservationsTab.vue` to display prices in currency units
- [x] 4.2 Convert pricing to cents before saving in pricing tab
- [x] 4.3 Ensure form displays existing pricing correctly after loading from API

## 5. Update seed data

- [x] 5.1 Locate and update seed data files to use cents format for pricing values
- [x] 5.2 Convert all existing pricing values in seed data (multiply by 100)
- [x] 5.3 Verify seed data loads correctly with new cent values

## 6. Testing and validation

- [x] 6.1 Test onboarding flow with various pricing values
- [x] 6.2 Test organization pricing update flow
- [x] 6.3 Verify pricing displays correctly in UI
- [x] 6.4 Verify pricing stores correctly as cents in database
- [x] 6.5 Verify seed data loads and displays pricing correctly
