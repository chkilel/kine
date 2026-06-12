## 1. Type Definitions

- [x] 1.1 Add PriceItem interface to shared/types/pricing.ts
- [x] 1.2 Update OrgPricing type to use priceItems array instead of rateCent object
- [x] 1.3 Update orgPricingSchema Zod validation to accept priceItems array
- [x] 1.4 Add migration helper function to convert rateCent to priceItems

## 2. Database Migration

- [x] 2.1 Create migration script to convert rateCent to priceItems for existing organizations
- [ ] 2.2 Test migration on staging database
- [ ] 2.3 Run migration on production database

## 3. Backend API

- [x] 3.1 Update organization update endpoint to accept priceItems array
- [x] 3.2 Add validation for unique codes within priceItems array
- [x] 3.3 Add validation for single default flag constraint
- [x] 3.4 Add validation that prevents using reserved code "DEFAULT"
- [x] 3.5 Add validation that prevents deleting all items
- [ ] 3.6 Test API with valid and invalid requests

## 4. Frontend Component

- [x] 4.1 Create PriceItems component (similar to PatientEmergencyContacts pattern)
- [x] 4.2 Implement add/edit form with fields for code, description, and prices
- [x] 4.3 Implement list display showing all priceItems
- [x] 4.4 Add default flag checkbox with single-default validation
- [x] 4.5 Implement delete functionality for priceItems
- [x] 4.6 Add empty state with add button
- [x] 4.7 Add cancel functionality for add/edit form
- [x] 4.8 Prevent editing code field for DEFAULT item

## 5. Page Integration

- [x] 5.1 Refactor pricing.vue to use priceItems array instead of rateCent
- [x] 5.2 Add PriceItems component to pricing.vue page
- [x] 5.3 Wire up priceItems state to pricing form state
- [x] 5.4 Update form submit handler to include priceItems
- [x] 5.5 Update handleCancel to reset priceItems from organization data
- [x] 5.6 Add migration logic to convert old rateCent format to priceItems on load
- [x] 5.7 Test form persistence and cancellation

## 6. Testing

- [x] 6.1 Add unit tests for PriceItem component
- [x] 6.2 Add tests for code uniqueness validation
- [x] 6.3 Add tests for reserved code validation
- [x] 6.4 Add tests for default flag constraint
- [x] 6.5 Add tests for minimum item constraint
- [ ] 6.6 Add E2E test for full add/edit/delete flow
- [x] 6.7 Test migration from rateCent to priceItems

## 7. Verification

- [x] 7.1 Run linting: pnpm lint
- [x] 7.2 Run type checking: pnpm typecheck
- [x] 7.3 Run tests: pnpm test
- [ ] 7.4 Manual testing of pricing page in development environment
- [ ] 7.5 Test existing organizations still have DEFAULT item after migration