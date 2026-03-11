# Change: Add Organization Onboarding

## Why

Users who register or login without an organization are unable to use the application because all core features require an organization context. Currently, the system doesn't guide these users through creating their first organization, leading to a confusing and incomplete onboarding experience.

## What Changes

- Add minimal onboarding page for organization creation with mandatory fields:
  - Organization name
  - Slug (auto-generated from name, editable)
  - Contact information (email + at least one phone)
  - Address (street, postal code, city)
  - Session rates (cabinet, domicile, téléconsultation)
- Update authentication middleware to detect users without organizations
- Redirect users without organizations to onboarding page
- Create organization creation API endpoint using Better Auth organization plugin
- Add navigation redirect after successful organization creation

## Impact

- Affected specs:
  - **NEW**: `onboarding` - New capability for first-time organization setup
- Affected code:
  - `app/middleware/auth.global.ts` - Add organization check and redirect logic
  - `app/pages/onboarding/index.vue` - NEW: Onboarding page with minimal organization form
  - `app/composables/useOnboarding.ts` - NEW: Composable for onboarding logic
  - `shared/types/onboarding.types.ts` - NEW: Onboarding-specific types and validation schemas
- Breaking changes: None (new functionality only)
