# Change: Add Organization Slug Prefix to Dashboard Routes

## Why

The organization slug is already added to the session via Better Auth hooks, but dashboard routes currently don't use it. Prefixing all dashboard routes with the organization slug provides clearer URL hierarchy, better multi-tenancy isolation, and makes the context explicit in the URL bar.

## What Changes

- **BREAKING**: All dashboard routes will be prefixed with `[slug]` parameter
  - `/` → `/[slug]/`
  - `/patients` → `/[slug]/patients`
  - `/patients/[id]` → `/[slug]/patients/[id]`
  - `/settings` → `/[slug]/settings`
  - `/settings/*` → `/[slug]/settings/*`
  - `/inbox` → `/[slug]/inbox`
  - `/therapists/day` → `/[slug]/therapists/day`
- Auth routes remain unchanged: `/login`, `/register`, `/onboarding`
- Organizations listing page remains unchanged: `/organizations` (org selector)
- Update middleware to validate slug matches session's `activeOrganizationSlug`
- Update all navigation links and `navigateTo()` calls to include org slug
- Create composable for building org-scoped URLs

## Impact

- Affected specs: `routing` (new capability)
- Affected code:
  - `app/pages/*` - all dashboard pages restructured under `[slug]/` directory
  - `app/layouts/default.vue` - navigation links updated
  - `app/middleware/auth.global.ts` - slug validation added
  - All components with `navigateTo()` calls or `:to=` links
  - New composable: `app/composables/useOrgRoute.ts`
