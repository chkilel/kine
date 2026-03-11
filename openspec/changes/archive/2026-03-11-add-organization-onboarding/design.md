## Context

The application requires users to be members of an organization to access core features (patients, appointments, billing, etc.). Currently, after registration, users without organizations have no clear path to create their first organization. The Better Auth organization plugin supports organization creation, but there's no UI flow for this critical onboarding step.

### Current State

- Users can register/login via `/login` and `/register`
- Auth middleware checks if user is authenticated
- No check for organization membership
- No guided onboarding for organization creation
- `authClient.organization.create` method is available but not exposed in UI

### Stakeholders

- New users registering for the first time
- Users logging in with accounts but no organization membership
- Clinic administrators setting up their practice

## Goals / Non-Goals

- **Goals**:
  - Provide minimal friction onboarding for first-time organization creation
  - Auto-generate slug from organization name to reduce user effort
  - Collect only essential information needed to start using the application
  - Ensure users cannot bypass organization creation
  - Seamlessly integrate with existing Better Auth organization plugin

- **Non-Goals**:
  - Full organization settings form (legal, banking, etc.)
  - Multiple organization management (user can only create first organization)
  - Organization invitation flow during onboarding
  - Organization switching (only needed when user has multiple organizations)

## Decisions

### Decision 1: Minimal Mandatory Fields

**What**: Only collect essential fields for organization creation during onboarding.

**Why**: Reduces onboarding friction. Additional fields (legal, banking, branding, etc.) can be added later in organization settings. The chosen fields provide:

- `name`: Organization identity
- `slug`: URL-safe identifier (auto-generated)
- `contact`: Email and phone for communication
- `address`: Physical location for clinic
- `pricing.sessionRates`: Pricing for consultations

**Alternatives considered**:

- All fields from full organization form → Too much friction, high abandonment risk
- Only name and slug → Insufficient for core business operations

### Decision 2: Slug Auto-Generation

**What**: Auto-generate slug from organization name, but allow manual editing.

**Why**: Most users don't understand URL slugs. Auto-generation reduces friction while manual editing accommodates edge cases (e.g., organization name conflicts).

**Implementation**: When user types organization name, automatically generate slug:

- Convert to lowercase
- Replace spaces and special characters with hyphens
- Remove diacritics (e.g., "Cabinet Kine" → "cabinet-kine")
- Allow user to override the generated slug

### Decision 3: Auth Middleware Organization Check

**What**: Add organization membership check to `auth.global.ts` middleware.

**Why**: Centralized check ensures users without organizations are consistently redirected to onboarding, regardless of which protected route they attempt to access.

**Implementation**:

```typescript
const { hasOrganizations } = await useOrganization()
if (isLoggedIn && !isGuestRoute && !hasOrganizations && to.path !== '/onboarding') {
  return navigateTo('/onboarding')
}
```

### Decision 4: Onboarding Page Route

**What**: Use `/onboarding` as the onboarding page route.

**Why**: Clear, conventional route name. Not in `(auth)` group because user is already authenticated.

**Alternative considered**: `/create-organization` → More technical, less user-friendly

### Decision 5: Better Auth Integration

**What**: Use existing `authClient.organization.create` method from Better Auth plugin.

**Why**: No need to reinvent organization creation logic. Better Auth already handles:

- Slug uniqueness validation
- Organization membership record creation
- Active organization assignment

## Technical Approach

### Flow

1. User registers or logs in
2. Auth middleware detects no organization membership
3. Redirect to `/onboarding`
4. User fills minimal organization form
5. On submit:
   - Auto-generate slug from name (or use user-edited value)
   - Validate all mandatory fields
   - Call `authClient.organization.create`
   - On success: set as active organization, redirect to dashboard
   - On error: display validation messages

### Components

- `OnboardingForm` - Main form component with field sections
- `SlugGenerator` - Composable for slug generation logic
- `OrganizationPricingInput` - Reusable pricing rates input component

### Validation

- Leverage existing Zod schemas from `shared/types/org.types.ts`
- Create minimal onboarding schema subset:
  - `onboardingSchema` = `orgNameSchema` + `orgSlugSchema` + `orgContactSchema` + `orgAddressSchema` + `orgPricingSchema.sessionRates`

## Risks / Trade-offs

### Risk: Slug Collision

**Risk**: Auto-generated slug may conflict with existing organization slug.

**Mitigation**: Better Auth's `organization.create` already validates slug uniqueness. If collision occurs, show error message and prompt user to modify slug.

### Risk: Incomplete Contact/Address Data

**Risk**: Users may provide minimal contact/address info that's insufficient for business operations.

**Mitigation**: Field validation ensures minimum required data (email, phone, street, postal code, city). Users can complete additional details in organization settings later.

### Trade-off: Session Rates Mandatory

**Trade-off**: Requiring session rates during onboarding may feel premature for new users.

**Rationale**: Pricing is essential for appointment booking and billing workflows. Collecting upfront prevents blocking users later when they try to create their first appointment or generate invoices. Default values are suggested to reduce friction.

## Migration Plan

- No data migration needed (new functionality)
- Backwards compatible: Existing users with organizations unaffected
- New route `/onboarding` added
- No API changes to existing endpoints

## Open Questions

None identified at this stage.

## Future Enhancements (Out of Scope)

- Organization template selection (pre-configured settings for common clinic types)
- Import from previous system or Excel
- Multi-step onboarding with progress indicator
- Onboarding analytics/tracking to measure completion rates
