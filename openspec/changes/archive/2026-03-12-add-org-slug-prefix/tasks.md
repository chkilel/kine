# Tasks: Add Organization Slug Prefix to Dashboard Routes

## 1. Infrastructure Setup

- [x] 1.1 Create `useOrgRoute` composable
  - Create `app/composables/useOrgRoute.ts`
  - Implement `orgPath()` function to generate org-scoped paths
  - Implement `orgNavigate()` function to navigate with org slug
  - Export composable with shared composable pattern
  - Add TypeScript types for path and navigation options

- [x] 1.2 Update authentication middleware
  - Modify `app/middleware/auth.global.ts`
  - Add slug validation logic
  - Implement redirect for mismatched slugs to active org slug
  - Test redirect behavior with invalid slug
  - Test behavior when no active organization exists

- [x] 1.3 Create route directory structure
  - Create `app/pages/[slug]/` directory
  - Move `app/pages/index.vue` to `app/pages/[slug]/index.vue`
  - Create subdirectories under `[slug]/` for each dashboard section
  - Verify Nuxt file-based routing recognizes new structure

## 2. Page Migration

- [x] 2.1 Migrate home page
  - Move `app/pages/index.vue` to `app/pages/[slug]/index.vue`
  - Update page to use `orgPath()` for internal links
  - Test page renders correctly at `/[slug]/`

- [x] 2.2 Migrate patients pages
  - Move `app/pages/patients/` to `app/pages/[slug]/patients/`
  - Move `app/pages/patients/index.vue` to new location
  - Move `app/pages/patients/new.vue` to new location
  - Move `app/pages/patients/[id].vue` to `app/pages/[slug]/patients/[id].vue`
  - Move `app/pages/patients/[id]/` directory to new location
  - Update all `navigateTo()` calls to use `orgNavigate()`
  - Test all patient pages render correctly

- [x] 2.3 Migrate settings pages
  - Move `app/pages/settings.vue` to `app/pages/[slug]/settings.vue`
  - Move `app/pages/settings/` directory to new location
  - Update all `navigateTo()` calls to use `orgNavigate()`
  - Test all settings pages render correctly

- [x] 2.4 Migrate inbox page
  - Move `app/pages/inbox.vue` to `app/pages/[slug]/inbox.vue`
  - Update any `navigateTo()` calls to use `orgNavigate()`
  - Test inbox page renders correctly

- [x] 2.5 Migrate therapists pages
  - Move `app/pages/therapists/` to `app/pages/[slug]/therapists/`
  - Move `app/pages/therapists/day.vue` to new location
  - Update `navigateTo()` calls to use `orgNavigate()`
  - Test schedule page renders correctly

- [x] 2.6 Verify organizations page remains global
  - Confirm `app/pages/organizations/` stays at root level
  - Confirm `app/pages/organizations/index.vue` stays at root level
  - Confirm `app/pages/organizations/[id].vue` stays at root level
  - Test organization switching still works

## 3. Layout and Navigation Updates

- [x] 3.1 Update default layout navigation
  - Modify `app/layouts/default.vue`
  - Update all `:to` bindings in navigation links
  - Replace hardcoded paths with composable calls
  - Test all sidebar navigation links work correctly

- [x] 3.2 Update OrganizationSwitchMenu component
  - Modify `app/components/organization/SwitchMenu.vue`
  - Ensure organization switching redirects to correct slug
  - Test switching between organizations

## 4. Component Navigation Updates

- [x] 4.1 Audit and update home components
  - Search `app/components/home/` for navigation patterns
  - Replace `navigateTo()` calls with `orgNavigate()`
  - Replace hardcoded URLs in templates
  - Test all navigation in home components

- [x] 4.2 Audit and update patient components
  - Search `app/components/patient/` for navigation patterns
  - Replace `navigateTo()` calls with `orgNavigate()`
  - Replace hardcoded URLs in templates
  - Test all navigation in patient components

- [x] 4.3 Audit and update appointment components
  - Search `app/components/appointment/` for navigation patterns
  - Replace `navigateTo()` calls with `orgNavigate()`
  - Replace hardcoded URLs in templates
  - Test all navigation in appointment components

- [x] 4.4 Audit and update other components
  - Search remaining components for `navigateTo()` and `:to` bindings
  - Update to use `orgNavigate()` or `orgPath()`
  - Test all component navigation

## 5. Testing and Validation

- [x] 5.1 Test authentication flow
  - Test login redirects to `/[slug]/` with correct org slug
  - Test onboarding flow creates org and sets active org
  - Test registration flow works correctly

- [x] 5.2 Test organization switching
  - Test switching organizations updates URLs
  - Test invalid slug redirects to active org
  - Test navigation persists correct org context

- [x] 5.3 Test all dashboard routes
  - Navigate to each dashboard page and verify URL includes slug
  - Test deep linking to nested routes
  - Test query parameters work with org prefix

- [x] 5.4 Test edge cases
  - Test navigation with no active org (redirects to onboarding)
  - Test direct URL access with wrong org slug
  - Test bookmarked URLs with old format (should 404)

- [x] 5.5 Run linting and type checking
  - Run `pnpm lint` to verify code style
  - Run `pnpm typecheck` to verify TypeScript correctness
  - Fix any linting or type errors

## 6. Documentation Updates

- [x] 6.1 Update routing documentation (if exists)
  - Document new route structure with org slug
  - Document `useOrgRoute` composable usage
  - Provide migration examples for future developers

- [x] 6.2 Update project.md if needed
  - Review `openspec/project.md` for routing conventions
  - Update if route structure conventions need documentation
