## 1. Database Schema Migration

- [x] 1.1 Update treatment_plan.ts schema to use single pricing JSON field instead of individual override fields
- [x] 1.2 Make pricing field required (not null)
- [x] 1.3 Create database migration to rename/add new column and migrate existing data
  - If plan had overrides, use those values
  - If plan had no overrides, populate from current org defaults
- [x] 1.4 Run migration and verify data integrity
- [x] 1.5 Update indexes if needed for new JSON field queries

## 2. Type Schema Updates

- [x] 2.1 Update shared/types/treatment-plan.ts with new pricing schema (required field)
- [x] 2.2 Update create schema to auto-populate pricing from org defaults
- [x] 2.3 Update update schema to allow modifying pricing values
- [x] 2.4 Update validation rules for pricing object (min 100, required fields)
- [x] 2.5 Verify TypeScript compilation

## 3. Plan Creation Logic

- [x] 3.1 Update POST /api/treatment-plans to fetch org pricing defaults
- [x] 3.2 Auto-populate plan.pricing from org.pricing.sessionRates on creation
- [x] 3.3 Handle edge case where org pricing is incomplete (use sensible defaults)
- [x] 3.4 Test plan creation with various org pricing configurations

## 4. API Endpoint Updates

- [x] 4.1 Update PATCH /api/treatment-plans/{id}.put.ts to accept pricing field in update body
- [x] 4.2 Update request Zod schemas to include pricing object
- [x] 4.3 Update PUT endpoint to handle partial pricing updates
- [x] 4.4 Test API endpoints manually or with tests

## 5. Business Logic Updates

- [x] 5.1 Simplify session cost calculation to use plan.pricing only (no fallback needed)
- [x] 5.2 Remove any inheritance chain logic (plan → org)
- [x] 5.3 Update any composable or utility functions that use pricing overrides
- [x] 5.4 Update treatment session cost calculation to use plan.pricing[location]
- [x] 5.5 Add unit tests for cost calculation with new data structure

## 6. Frontend Updates

- [x] 6.1 Add pricing input fields to TreatmentPlanCreateSlideover.vue (clinic, home, telehealth)
- [x] 6.2 Update formState to include pricing object with org defaults pre-populated
- [x] 6.3 Update any other Vue components that set/get pricing overrides
- [x] 6.4 Update form handling to work with pricing JSON object structure
- [x] 6.5 Update UI to display pricing in new format (all values always shown)
- [x] 6.6 Test pricing update workflow in UI
- [x] 6.7 Verify plan creation shows correct default prices from org

## 7. Testing & Validation

- [x] 7.1 Run existing tests to ensure no regressions
- [x] 7.2 Add integration tests for new pricing data structure
- [x] 7.3 Test plan creation inherits org pricing correctly
- [x] 7.4 Test plan pricing updates work independently of org pricing
- [x] 7.5 Test session cost calculation uses plan pricing only
- [x] 7.6 Verify org pricing changes don't affect existing plans
- [x] 7.7 Manual end-to-end testing of pricing workflow

## 8. Documentation

- [x] 8.1 Update API documentation if needed
- [x] 8.2 Update any inline code comments to reflect new behavior
- [x] 8.3 Update AGENTS.md or other guides if they reference the old structure
- [x] 8.4 Document inheritance behavior change if important for users
