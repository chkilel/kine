## Context

The organization detail page (`/organizations/[id]`) currently renders all 7 tabs via a single `UTabs` component with query-param-based routing (`?tab=legal`). The patient detail pages have already been migrated to a child-route pattern using `<NuxtPage />` with a contextual sidebar menu (`AppPatientContextualMenu`). This change applies the same pattern to organization pages for consistency, better code splitting, and proper deep-linkable URLs.

Current state:
- `organizations/[id].vue`: Monolithic page with `UTabs`, `tabRefMap`, `activeTab` computed (query-param), save/cancel footer
- Tab components: `OrganizationGeneralInformationTab`, `OrganizationLegalInformationTab`, `OrganizationPricingReservationsTab`, `OrganizationClinicalConfigurationTab`, `OrganizationAppearanceTab`, `OrganizationAdvancedTab`, `OrganizationRoomsTab`
- Layout: `default.vue` already has patient contextual menu logic (`isPatientContext` computed)

## Goals / Non-Goals

**Goals:**
- Match the patient detail page architecture for organization detail pages
- Create proper deep-linkable routes for each organization tab
- Add `AppOrganizationContextualMenu` to replace main nav in org context
- Move save/cancel footer into individual child pages that need it

**Non-Goals:**
- Modifying existing tab components (their API stays the same)
- Changing the organization header card design
- Adding new features or capabilities to any tab
- Backend/API changes

## Decisions

### 1. Parent page keeps header card, delegates to `<NuxtPage />`
The parent `organizations/[id].vue` keeps the existing organization header card (avatar, name, status, slug, creation date) and adds `<NuxtPage />` below it. The `UTabs`, `tabRefMap`, `activeTab` computed, save/cancel footer, and all tab template slots are removed.

**Rationale**: Matches patient page pattern exactly. The header provides context regardless of which sub-page is active.

### 2. Child page structure mirrors tab values
New files created under `organizations/[id]/`:
- `index.vue` → renders `OrganizationGeneralInformationTab`
- `legal.vue` → renders `OrganizationLegalInformationTab`
- `pricing.vue` → renders `OrganizationPricingReservationsTab`
- `clinical.vue` → renders `OrganizationClinicalConfigurationTab`
- `appearance.vue` → renders `OrganizationAppearanceTab`
- `advanced.vue` → renders `OrganizationAdvancedTab`
- `rooms.vue` → renders `OrganizationRoomsTab`

**Alternative considered**: Using dynamic route `[tab].vue` to map tab names to components. Rejected because it loses type safety and Nuxt's static route analysis benefits.

### 3. Save/cancel footer moved to child pages
Pages with editable forms (general, legal, pricing, clinical, appearance, advanced) get their own save/cancel footer bar. `rooms.vue` does not (same as current behavior). Each page manages its own `ref` to the tab component and its own `handleSave`/`handleCancel`.

**Rationale**: Each page is self-contained. No need for cross-page tab ref management.

### 4. Contextual menu component follows `AppPatientContextualMenu` pattern exactly
`AppOrganizationContextualMenu` checks `isOrganizationContext` (route matches `/organizations/:id` pattern), renders `UNavigationMenu` with vertical links and a back button. Uses Hugeicons, supports `collapsed` prop for tooltip mode.

### 5. Layout integration: extend existing contextual menu logic
In `default.vue`, add `isOrganizationContext` computed alongside `isPatientContext`. When either is true, hide main nav and show the respective contextual menu. Only one context can be active at a time (routes are mutually exclusive).

### 6. Breadcrumbs update with route
Parent page `breadcrumbItems` becomes a computed that reads the current route name/path to set the last breadcrumb label dynamically (e.g., "Tarifs & Réservations" when on `/organizations/[id]/pricing`).

## Risks / Trade-offs

- **[Risk]** Existing bookmarks with `?tab=pricing` query params break → Mitigation: This is a private admin tool; no public bookmarks expected. Could add a redirect from `?tab=` to the corresponding child route if needed.
- **[Risk]** 7 new page files increase surface area → Mitigation: Pages are thin wrappers around existing components; minimal new logic.
- **[Trade-off]** Slightly more files to maintain vs. single monolithic page → Accepted: Better code splitting, proper URLs, and consistency with patient pages outweigh the cost.
