## ADDED Requirements

### Requirement: Parent page renders persistent header with NuxtPage
The `organizations/[id].vue` parent page SHALL display the organization header card (avatar, name, status badge, slug, creation date) and render `<NuxtPage />` below it for child route content. The `UTabs` component, query-param-based tab routing, tab ref map, and save/cancel footer SHALL be removed from this page.

#### Scenario: User visits organization detail page
- **WHEN** user navigates to `/organizations/org-123`
- **THEN** the parent page SHALL display the organization header card
- **THEN** the parent page SHALL render the child `index.vue` page content below the header
- **THEN** no `UTabs` component SHALL be visible

#### Scenario: UTabs and query-param routing removed
- **WHEN** the parent page is loaded
- **THEN** there SHALL be no `UTabs` component in the DOM
- **THEN** there SHALL be no `tabRefMap`, `activeTab` computed, or `route.query.tab` logic

### Requirement: Child pages for each organization tab
The system SHALL create dedicated child page files under `organizations/[id]/` for each former tab: `index.vue` (general), `legal.vue`, `pricing.vue`, `clinical.vue`, `appearance.vue`, `advanced.vue`, `rooms.vue`. Each child page SHALL render the corresponding existing tab component.

#### Scenario: Child page mapping
- **WHEN** user navigates to `/organizations/org-123/legal`
- **THEN** the `legal.vue` child page SHALL render `OrganizationLegalInformationTab`

#### Scenario: General info as index page
- **WHEN** user navigates to `/organizations/org-123`
- **THEN** the `index.vue` child page SHALL render `OrganizationGeneralInformationTab`

### Requirement: Save/cancel actions in child pages
Child pages that previously supported save/cancel (general, legal, pricing, clinical, appearance, advanced) SHALL include their own save/cancel footer action bar, using the same UI pattern previously in the parent page.

#### Scenario: Save/cancel bar on editable pages
- **WHEN** user is on `/organizations/org-123/legal`
- **THEN** the page SHALL display "Annuler les changements" and "Enregistrer les modifications" buttons at the bottom
- **THEN** clicking save SHALL call the child tab component's `handleSave` method
- **THEN** clicking cancel SHALL call the child tab component's `handleCancel` method

#### Scenario: No save/cancel on rooms page
- **WHEN** user is on `/organizations/org-123/rooms`
- **THEN** no save/cancel action bar SHALL be displayed

### Requirement: Breadcrumbs reflect active sub-page
The breadcrumb items on the parent page SHALL update to show the current sub-page name when navigating between child pages.

#### Scenario: Breadcrumb on child page
- **WHEN** user is on `/organizations/org-123/pricing`
- **THEN** the last breadcrumb item SHALL display "Tarifs & Réservations" (or similar) instead of "Profil"

### Requirement: Existing tab components unchanged
The existing tab components (`OrganizationGeneralInformationTab`, `OrganizationLegalInformationTab`, etc.) SHALL NOT be modified. They SHALL continue to expose `handleSave`, `handleCancel`, and `isSaving` via `defineExpose`.

#### Scenario: Tab component API preserved
- **WHEN** a child page renders `OrganizationPricingReservationsTab`
- **THEN** the component SHALL expose `handleSave`, `handleCancel`, and `isSaving` as before
