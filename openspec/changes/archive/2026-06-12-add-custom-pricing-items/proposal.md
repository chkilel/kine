## Why

Organizations need the flexibility to define multiple pricing items beyond the single session rate configuration. Currently, pricing is limited to one hardcoded session rate set with clinic, home, and telehealth prices, which doesn't support diverse billing scenarios like specialized treatments, equipment fees, or administrative charges.

## What Changes

- Refactor pricing structure from single `rateCent` object to `priceItems` array
- Migrate existing rateCent to become the first item in priceItems (code: "DEFAULT", description: "Tarif de séance")
- Add ability for organizations to create additional pricing items with:
  - Code (unique identifier)
  - Description (name of the item)
  - Prices for clinic/home/telehealth contexts
  - Boolean flag to set as default rate

- Update pricing page UI to display and manage priceItems using the same interactive pattern as emergency contacts (PatientEmergencyContacts.vue)
- Store priceItems in the organization's pricing configuration
- Allow users to add, edit, and remove priceItems

## Capabilities

### New Capabilities
- `price-items`: Management of multiple pricing items with code, description, and per-context prices

### Modified Capabilities
- None (this refactors existing pricing structure to support multiple items while maintaining same functionality)

## Impact

- Database: Refactor organizations table pricing column from rateCent object to priceItems array
- Frontend: Modify `/organizations/[id]/pricing.vue` page to use priceItems array
- Backend: Update organization update API endpoint to handle priceItems array
- Types: Refactor OrgPricing type to use priceItems array instead of rateCent object