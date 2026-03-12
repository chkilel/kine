# Tasks

## 1. Prepare Type Definitions and Validation

- [x] 1.1 Create `shared/types/onboarding.types.ts` with onboarding-specific Zod schema
- [x] 1.2 Define `onboardingSchema` combining: orgNameSchema, orgSlugSchema, orgContactSchema, orgAddressSchema, and orgPricingSchema.sessionRates
- [x] 1.3 Create TypeScript types from onboardingSchema
- [x] 1.4 Add slug generation utility function (name → slug conversion)

## 2. Create Onboarding Composable

- [x] 2.1 Create `app/composables/useOnboarding.ts`
- [x] 2.2 Implement slug generation with name watching (auto-generate on name change)
- [x] 2.3 Implement slug validation with debounce
- [x] 2.4 Implement organization creation using `authClient.organization.create`
- [x] 2.5 Implement success handling: set active organization, redirect to dashboard
- [x] 2.6 Implement error handling with user-friendly messages

## 3. Build Onboarding Page

- [x] 3.1 Create `app/pages/onboarding/index.vue` page
- [x] 3.2 Set up page meta (no layout requirement)
- [x] 3.3 Implement OnboardingForm component
- [x] 3.4 Add form sections:
  - Organization name input with live slug preview/edit
  - Contact information (email + phone array)
  - Address (street, postal code, city)
  - Session rates (cabinet, domicile, téléconsultation) with default values
- [x] 3.5 Add form validation using onboardingSchema
- [x] 3.6 Add submit button with loading state
- [x] 3.7 Add error message display
- [x] 3.8 Style with Nuxt UI components for consistency

## 4. Update Authentication Middleware

- [x] 4.1 Modify `app/middleware/auth.global.ts`
- [x] 4.2 Import and use `useOrganization` composable
- [x] 4.3 Add check for `hasOrganizations` after authentication check
- [x] 4.4 Implement redirect to `/onboarding` when user has no organizations
- [x] 4.5 Allow `/onboarding` route to pass without redirect (prevent infinite loop)

## 5. Add Routing Configuration

- [x] 5.1 Verify `/onboarding` route is accessible for authenticated users
- [x] 5.2 Ensure `/onboarding` redirects unauthenticated users to `/login`
- [x] 5.3 Test navigation flow: Register → Onboarding → Dashboard

## 6. Testing and Validation

- [x] 6.1 Test onboarding flow with valid data
- [x] 6.2 Test onboarding with invalid slug (collision scenario)
- [x] 6.3 Test auto-slug generation from organization name
- [x] 6.4 Test manual slug editing
- [x] 6.5 Test form validation for all required fields
- [x] 6.6 Test auth middleware redirect logic (no org → onboarding)
- [x] 6.7 Test that existing users with organizations bypass onboarding
- [x] 6.8 Test error handling and display

## 7. Documentation and Cleanup

- [x] 7.1 Add inline comments for complex logic (slug generation, auth middleware)
- [x] 7.2 Verify no console errors or warnings in development
- [x] 7.3 Run type checking: `pnpm typecheck` (if available)
- [x] 7.4 Run linting: `pnpm lint` (if available)
