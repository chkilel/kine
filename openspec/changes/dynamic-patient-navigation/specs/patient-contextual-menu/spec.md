## ADDED Requirements

### Requirement: Patient contextual menu visibility
The system SHALL display a contextual menu on the left side ONLY when viewing a patient detail page.

#### Scenario: Patient context detection
- **WHEN** user navigates to any route matching `/patients/[id]/...`
- **THEN** contextual menu SHALL be visible on the left side
- **WHEN** user navigates to any route NOT matching patient detail pattern
- **THEN** contextual menu SHALL be hidden

#### Scenario: Existing tabs unchanged
- **WHEN** contextual menu is displayed
- **THEN** existing page tabs SHALL remain visible and functional
- **THEN** existing page tabs SHALL NOT be modified

### Requirement: Patient menu items mapping
The contextual menu SHALL map to existing patient detail pages.

#### Scenario: Display patient menu items
- **WHEN** user is on any patient detail page
- **THEN** contextual menu SHALL show 5 navigation items with exact labels: "Vue d'Ensemble", "Plan de traitement", "Hors Plan", "Documents", "Facturation"
- **THEN** each item SHALL be clickable and navigate to respective existing page
- **THEN** current page SHALL be visually highlighted in the menu

#### Scenario: Navigate to existing patient pages
- **WHEN** user clicks on "Vue d'Ensemble" in contextual menu
- **THEN** system SHALL navigate to existing `/patients/[id]/index`
- **WHEN** user clicks on "Plan de traitement" in contextual menu
- **THEN** system SHALL navigate to existing `/patients/[id]/plan`
- **WHEN** user clicks on "Hors Plan" in contextual menu
- **THEN** system SHALL navigate to existing `/patients/[id]/seances`
- **WHEN** user clicks on "Documents" in contextual menu
- **THEN** system SHALL navigate to existing `/patients/[id]/documents`
- **WHEN** user clicks on "Facturation" in contextual menu
- **THEN** system SHALL navigate to existing `/patients/[id]/facturation`

### Requirement: Return to main navigation
The contextual menu SHALL provide a return button to exit patient context.

#### Scenario: Click return button
- **WHEN** user clicks the return button at bottom of contextual menu while in patient context
- **THEN** system SHALL navigate to `/patients`
- **THEN** contextual menu SHALL become hidden
- **THEN** patient context SHALL be cleared

#### Scenario: Return button visibility
- **WHEN** user is in patient context
- **THEN** return button SHALL be visible and clickable at bottom of contextual menu
- **WHEN** user is not in patient context
- **THEN** return button SHALL be hidden

### Requirement: Patient ID preservation across navigation
The system SHALL preserve the patient ID when navigating between patient pages via contextual menu.

#### Scenario: Navigate within patient context
- **WHEN** user navigates from `/patients/abc123/index` to `/patients/abc123/documents`
- **THEN** patient ID `abc123` SHALL be preserved in the URL
- **THEN** contextual menu SHALL maintain patient context
- **WHEN** user navigates from `/patients/abc123/documents` to `/patients/xyz789/index`
- **THEN** patient ID SHALL update to `xyz789`
- **THEN** contextual menu SHALL update to reflect new patient context

### Requirement: No modification to existing pages
The system SHALL NOT modify existing patient detail pages or their components.

#### Scenario: Existing page structure preserved
- **WHEN** patient detail pages are viewed
- **THEN** existing components SHALL render as-is without modification
- **THEN** existing tabs SHALL render as-is without modification
- **THEN** existing page functionality SHALL remain unchanged

#### Scenario: Existing page navigation preserved
- **WHEN** user navigates using existing tabs
- **THEN** navigation SHALL work as before without modification
- **WHEN** user navigates using contextual menu
- **THEN** navigation SHALL target the same pages as existing tabs

### Requirement: Contextual menu accessibility
The contextual menu SHALL follow ARIA best practices for accessibility.

#### Scenario: ARIA attributes
- **WHEN** contextual menu is rendered in patient context
- **THEN** navigation links SHALL have proper ARIA labels
- **THEN** current page SHALL be indicated with `aria-current="page"`
- **THEN** return button SHALL have aria-label describing its function

#### Scenario: Keyboard navigation
- **WHEN** user uses keyboard to navigate
- **THEN** tab order SHALL follow visual order of contextual menu items
- **THEN** all navigation items SHALL be focusable
- **THEN** return button SHALL be focusable and accessible via keyboard