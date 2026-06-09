## ADDED Requirements

### Requirement: Contextual sidebar replaces main navigation on organization detail pages
The system SHALL render `AppOrganizationContextualMenu` in the sidebar when the current route matches `/organizations/:id` or any child route (`/organizations/:id/*`). The main application navigation SHALL be hidden in this context, exactly matching the patient contextual menu behavior.

#### Scenario: User navigates to organization general info page
- **WHEN** user is on route `/organizations/org-123`
- **THEN** the sidebar SHALL display `AppOrganizationContextualMenu` with organization-specific navigation links
- **THEN** the main app navigation menu SHALL be hidden

#### Scenario: User navigates to a child page
- **WHEN** user navigates to `/organizations/org-123/pricing`
- **THEN** the sidebar SHALL continue displaying `AppOrganizationContextualMenu`
- **THEN** the main app navigation menu SHALL remain hidden

### Requirement: Contextual menu displays all organization sub-pages as navigation links
The contextual menu SHALL contain vertical navigation links for each organization sub-page, using Hugeicons (not Lucide), with French labels matching the current tab names.

#### Scenario: Navigation link items
- **WHEN** `AppOrganizationContextualMenu` is rendered
- **THEN** it SHALL display the following navigation links with their icons and routes:
  - "Informations générales" (icon: `i-hugeicons-building-02`) → `/organizations/:id`
  - "Informations légales" (icon: `i-hugeicons-scale`) → `/organizations/:id/legal`
  - "Tarifs & Réservations" (icon: `i-hugeicons-calendar-clock`) → `/organizations/:id/pricing`
  - "Configuration clinique" (icon: `i-hugeicons-stethoscope`) → `/organizations/:id/clinical`
  - "Apparence" (icon: `i-hugeicons-palette`) → `/organizations/:id/appearance`
  - "Avancé" (icon: `i-hugeicons-settings-01`) → `/organizations/:id/advanced`
  - "Gestion des Salles" (icon: `i-hugeicons-door-open`) → `/organizations/:id/rooms`

### Requirement: Active link highlighting
The contextual menu SHALL highlight the currently active page link using `ariaCurrent: 'page'`, matching the patient contextual menu pattern.

#### Scenario: Active page is highlighted
- **WHEN** user is on `/organizations/org-123/pricing`
- **THEN** the "Tarifs & Réservations" link SHALL be visually marked as the active page

### Requirement: Back to organizations button
The contextual menu SHALL include a "Retour aux cabinets" button below the navigation links that navigates to `/organizations`.

#### Scenario: User clicks back button
- **WHEN** user clicks "Retour aux cabinets"
- **THEN** the user SHALL be navigated to `/organizations`
- **THEN** the main navigation menu SHALL be restored

### Requirement: Collapsed sidebar tooltip support
The contextual menu SHALL support the `collapsed` prop from the sidebar, rendering in tooltip mode when the sidebar is collapsed, matching `AppPatientContextualMenu` behavior.

#### Scenario: Sidebar is collapsed
- **WHEN** the dashboard sidebar is in collapsed state
- **THEN** `AppOrganizationContextualMenu` SHALL display icons only with tooltips on hover
