## 1. Refactor Parent Page

- [x] 1.1 Refactor `app/pages/organizations/[id].vue`: remove `UTabs`, `tabRefMap`, `activeTab` computed, `handleSave`/`handleCancel` functions, `tabs` array, and save/cancel footer template. Keep only the organization header card and add `<NuxtPage />` below it.
- [x] 1.2 Update breadcrumbs in parent page to use a computed that reflects the current child route name (e.g., "Profil" for index, "Informations légales" for legal, etc.).

## 2. Create Child Pages

- [x] 2.1 Create `app/pages/organizations/[id]/index.vue` — render `OrganizationGeneralInformationTab` with save/cancel footer (ref + handleSave/handleCancel).
- [x] 2.2 Create `app/pages/organizations/[id]/legal.vue` — render `OrganizationLegalInformationTab` with save/cancel footer.
- [x] 2.3 Create `app/pages/organizations/[id]/pricing.vue` — render `OrganizationPricingReservationsTab` with save/cancel footer.
- [x] 2.4 Create `app/pages/organizations/[id]/clinical.vue` — render `OrganizationClinicalConfigurationTab` with save/cancel footer.
- [x] 2.5 Create `app/pages/organizations/[id]/appearance.vue` — render `OrganizationAppearanceTab` with save/cancel footer.
- [x] 2.6 Create `app/pages/organizations/[id]/advanced.vue` — render `OrganizationAdvancedTab` with save/cancel footer.
- [x] 2.7 Create `app/pages/organizations/[id]/rooms.vue` — render `OrganizationRoomsTab` (no save/cancel footer).

## 3. Contextual Menu Component

- [x] 3.1 Create `app/components/app/OrganizationContextualMenu.vue` following the `AppPatientContextualMenu` pattern: `isOrganizationContext` route check, `UNavigationMenu` with 7 vertical links (Hugeicons), "Retour aux cabinets" back button, `collapsed` prop support.
- [x] 3.2 Wire `AppOrganizationContextualMenu` into `app/layouts/default.vue` alongside `AppPatientContextualMenu`: add `isOrganizationContext` computed, show org contextual menu when in org context, hide main nav.

## 4. Verification

- [x] 4.1 Run `pnpm lint` and `pnpm typecheck` to verify no errors.
- [x] 4.2 Run `pnpm test` to check for regressions.
- [ ] 4.3 Manually verify all 7 routes render correctly and navigation between them works via sidebar contextual menu.
