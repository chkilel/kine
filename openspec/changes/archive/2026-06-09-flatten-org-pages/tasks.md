## 1. Flatten General Information

- [x] 1.1 Move content from `components/organization/GeneralInformationTab.vue` into `pages/organizations/[id]/index.vue`, remove ref wrapper pattern
- [x] 1.2 Delete `components/organization/GeneralInformationTab.vue`

## 2. Flatten Pricing Reservations

- [x] 2.1 Move content from `components/organization/PricingReservationsTab.vue` into `pages/organizations/[id]/pricing.vue`, remove ref wrapper pattern
- [x] 2.2 Delete `components/organization/PricingReservationsTab.vue`

## 3. Flatten Clinical Configuration

- [x] 3.1 Move content from `components/organization/ClinicalConfigurationTab.vue` into `pages/organizations/[id]/clinical.vue`, remove ref wrapper pattern
- [x] 3.2 Delete `components/organization/ClinicalConfigurationTab.vue`

## 4. Flatten Appearance

- [x] 4.1 Move content from `components/organization/AppearanceTab.vue` into `pages/organizations/[id]/appearance.vue`, remove ref wrapper pattern
- [x] 4.2 Delete `components/organization/AppearanceTab.vue`

## 5. Flatten Rooms

- [x] 5.1 Move content from `components/organization/RoomsTab.vue` into `pages/organizations/[id]/rooms.vue`
- [x] 5.2 Delete `components/organization/RoomsTab.vue`

## 6. Flatten Advanced

- [x] 6.1 Move content from `components/organization/AdvancedTab.vue` into `pages/organizations/[id]/advanced.vue`, remove ref wrapper pattern
- [x] 6.2 Delete `components/organization/AdvancedTab.vue`

## 7. Flatten Legal Information

- [x] 7.1 Move content from `components/organization/LegalInformationTab.vue` into `pages/organizations/[id]/legal.vue`, remove ref wrapper pattern
- [x] 7.2 Delete `components/organization/LegalInformationTab.vue`

## 8. Verify

- [x] 8.1 Run `pnpm lint` and `pnpm typecheck` to confirm no regressions
- [x] 8.2 Verify no remaining imports of deleted Tab components anywhere in the codebase
