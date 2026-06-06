## 1. Foundation & Components

- [ ] 1.1 Create `PatientContextualMenu.vue` component in `app/components/`
- [ ] 1.2 Add patient context detection logic using `useRoute()` to identify patient routes (`/patients/[id]/*`)
- [ ] 1.3 Implement patient navigation menu with 5 items mapping to existing pages: index, plan, seances, documents, facturation
- [ ] 1.4 Add return button at bottom of contextual menu to navigate to `/patients`
- [ ] 1.5 Add active state highlighting for current page in contextual menu
- [ ] 1.6 Integrate `PatientContextualMenu` into `app/AppDashboardPage.vue` to REPLACE main navigation in patient context
- [ ] 1.7 Add TypeScript types for contextual menu navigation items

## 2. Navigation & Routing Logic

- [ ] 2.1 Implement patient context detection regex pattern for existing routes `/patients/[id]/*`
- [ ] 2.2 Add navigation click handlers for contextual menu items to existing pages
- [ ] 2.3 Implement return button navigation to `/patients`
- [ ] 2.4 Ensure patient ID is preserved when navigating between existing pages
- [ ] 2.5 Handle browser back/forward navigation for existing patient pages
- [ ] 2.6 Ensure existing page routes remain unchanged

## 3. Styling & UI Polish

- [ ] 3.1 Style contextual menu items using Nuxt UI components (UButton or link-like)
- [ ] 3.2 Add active state styling with Nuxt UI color system (blue primary)
- [ ] 3.3 Style return button with appropriate Nuxt UI variant (subtle/ghost)
- [ ] 3.4 Ensure contextual menu REPLACES main navigation (same width/position)
- [ ] 3.5 Add smooth transition animation between main navigation and contextual menu
- [ ] 3.6 Ensure contextual menu does not overlap existing page tabs
- [ ] 3.7 Ensure responsive design for contextual menu on mobile/tablet
- [ ] 3.8 Add hover states for navigation items
- [ ] 3.9 Add ARIA attributes for accessibility (labels, current page indicator)
- [ ] 3.10 Ensure existing page tabs remain visible and functional

## 4. Integration & Verification

- [ ] 4.1 Verify contextual menu REPLACES main navigation on patient detail pages
- [ ] 4.2 Verify contextual menu is HIDDEN on non-patient pages (main navigation shown)
- [ ] 4.3 Verify existing patient pages (index, plan, seances, documents, facturation) are NOT modified
- [ ] 4.4 Verify existing page tabs on patient pages remain unchanged
- [ ] 4.5 Verify navigation via contextual menu works correctly to all patient pages
- [ ] 4.6 Verify navigation via existing tabs still works as before
- [ ] 4.7 Verify no additional screen space is taken (menu replaces, not adds)

## 5. Testing

- [ ] 5.1 Create unit test for `PatientContextualMenu` context detection logic
- [ ] 5.2 Create unit test for contextual menu rendering in patient context
- [ ] 5.3 Create unit test for contextual menu replacing main navigation
- [ ] 5.4 Create unit test for main navigation showing in non-patient context
- [ ] 5.5 Create unit test for navigation click handlers
- [ ] 5.6 Create unit test for return button functionality
- [ ] 5.7 Create E2E test for patient contextual menu visibility
- [ ] 5.8 Create E2E test for navigating between patient pages via contextual menu
- [ ] 5.9 Create E2E test for return button functionality
- [ ] 5.10 Create E2E test to verify existing tabs still work
- [ ] 5.11 Test browser back/forward navigation with contextual menu

## 6. Validation & Finalization

- [ ] 6.1 Verify linting passes (`pnpm lint`)
- [ ] 6.2 Verify TypeScript type checking passes (`pnpm typecheck`)
- [ ] 6.3 Verify tests pass (`pnpm test`)
- [ ] 6.4 Manual testing: Navigate from patients list to patient detail
- [ ] 6.5 Manual testing: Verify contextual menu REPLACES main navigation
- [ ] 6.6 Manual testing: Verify no extra space is taken on screen
- [ ] 6.7 Manual testing: Click each contextual menu item
- [ ] 6.8 Manual testing: Verify navigation goes to correct existing page
- [ ] 6.9 Manual testing: Click return button and verify navigation
- [ ] 6.10 Manual testing: Test keyboard navigation in contextual menu
- [ ] 6.11 Manual testing: Test browser back/forward buttons
- [ ] 6.12 Manual testing: Verify existing page tabs still work
- [ ] 6.13 Check accessibility with screen reader or ARIA inspector