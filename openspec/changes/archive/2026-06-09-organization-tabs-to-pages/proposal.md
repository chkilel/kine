## Why

The organization detail page (`/organizations/[id]`) currently uses a monolithic single-page tab layout with 7 tabs rendered inside `UTabs`. This creates several problems: all tab components are loaded simultaneously (poor performance), URLs are query-param-based (`?tab=pricing`) instead of proper routes, and the page lacks a contextual sidebar navigation — unlike the patient detail pages which already use the `<NuxtPage />` child-route pattern with `AppPatientContextualMenu`. This inconsistency hurts UX and maintainability. Migrating to dedicated child pages aligns the organization section with the established patient detail pattern.

## What Changes

- Replace the monolithic `organizations/[id].vue` tab page with a parent page that renders a persistent organization header card + `<NuxtPage />` for child routes
- Create 7 dedicated child pages under `organizations/[id]/`:
  - `index.vue` — Informations générales (general)
  - `legal.vue` — Informations légales
  - `pricing.vue` — Tarifs & Réservations
  - `clinical.vue` — Configuration clinique
  - `appearance.vue` — Apparence
  - `advanced.vue` — Avancé
  - `rooms.vue` — Gestion des Salles
- Create an `AppOrganizationContextualMenu` component that replaces the main sidebar navigation when on organization detail routes (same pattern as `AppPatientContextualMenu`)
- Wire the contextual menu into `default.vue` layout alongside the existing patient contextual menu logic
- Remove the `UTabs` component, query-param-based tab routing, and tab ref management from the parent page
- Move the save/cancel footer action bar into individual child pages that need it (general, legal, pricing, clinical, appearance, advanced)
- Update breadcrumbs to reflect the active sub-page

## Capabilities

### New Capabilities
- `organization-contextual-menu`: Sidebar contextual navigation component for organization detail pages, replacing main nav when in org context
- `organization-child-pages`: Dedicated child route pages for each organization tab (general, legal, pricing, clinical, appearance, advanced, rooms)

### Modified Capabilities

## Impact

- **Frontend pages**: `app/pages/organizations/[id].vue` (major refactor), 7 new child page files
- **Components**: New `AppOrganizationContextualMenu`, possible refactors of existing tab components if they need save/cancel controls moved inline
- **Layout**: `app/layouts/default.vue` — add organization contextual menu alongside patient contextual menu
- **Routing**: New routes `/organizations/[id]`, `/organizations/[id]/legal`, `/organizations/[id]/pricing`, `/organizations/[id]/clinical`, `/organizations/[id]/appearance`, `/organizations/[id]/advanced`, `/organizations/[id]/rooms`
- **No API/backend changes** — purely a frontend routing and navigation refactor
- **No tenant boundary or compliance impact** — only affects navigation structure
