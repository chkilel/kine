# treatment-plan-notes Specification

## Purpose
TBD - created by archiving change 2026-01-08-modify-treatment-plan-notes-ui. Update Purpose after archive.
## Requirements
### Requirement: Interactive Note Addition Interface

The PatientTreatmentPlanSidebar component MUST provide an interactive interface for adding clinical notes to a treatment plan, featuring a textarea with submit functionality.

#### Scenario: Display note input interface

**Given** the PatientTreatmentPlanSidebar component is rendered with a treatmentPlan prop
**When** viewing the "Notes & Follow-up" section
**Then** a textarea should be displayed with placeholder "Ajouter une note clinique..."
**And** the textarea should have proper styling using Nuxt UI colors (bg-muted for background, border-default for border)
**And** a send button should be positioned absolutely in the bottom-right corner
**And** the send button should display a send icon using Nuxt UI's material-symbols-outlined or equivalent

#### Scenario: Submit new clinical note

**Given** the note textarea is displayed
**When** user enters a clinical note and clicks the send button
**Then** the note should be validated (not empty)
**And** on successful validation, a new note object should be created with:

- author: current therapist's name
- date: current date/time
- content: the text entered in textarea
  **And** the note should be added to treatmentPlan.notes array
  **And** the textarea should be cleared
  **And** a success toast notification should be displayed
  **And** the notes timeline should update to show the new note

#### Scenario: Prevent empty note submission

**Given** the note textarea is empty
**When** user clicks the send button
**Then** the submission should be prevented
**And** no new note should be added to treatmentPlan.notes
**And** an error message or visual feedback should indicate the note cannot be empty

### Requirement: Timeline Display for Treatment Plan Notes

The component MUST display treatment plan notes in a chronological timeline format with visual indicators for each note entry.

#### Scenario: Display notes in timeline format

**Given** treatmentPlan.notes contains one or more notes
**When** viewing the "Notes & Follow-up" section
**Then** notes should be displayed in a timeline format with:

- Left border line for visual continuity
- Colored dot indicator for each note
- Date and author information in text-muted color
- Note content in text-sm
  **And** notes should be sorted by date in descending order (newest first)
  **And** the latest note's dot should use primary color
  **And** older notes' dots should use muted color

#### Scenario: Display empty state for no notes

**Given** treatmentPlan.notes is empty or null
**When** viewing the "Notes & Follow-up" section
**Then** an appropriate message should be displayed: "Aucune note de suivi pour ce plan de traitement"
**And** the message should use text-muted color
**And** the timeline container should not be displayed

#### Scenario: Scrollable notes container

**Given** treatmentPlan.notes contains multiple notes
**When** viewing the notes timeline
**Then** the notes container should have a max-height of 250px
**And** the container should be scrollable when content exceeds max-height
**And** proper scrollbar styling should be applied

### Requirement: Nuxt UI Design System Color Application

The component MUST use Nuxt UI design system colors for consistent styling across the application, avoiding hardcoded color values.

#### Scenario: Apply Nuxt UI colors to note input

**Given** the note input interface is displayed
**When** viewing the textarea and button elements
**Then** textarea should use bg-muted for background
**And** textarea should use border-default for border
**And** textarea text should use default text color
**And** send button should use primary color for icon
**And** send button background should use bg-default or white
**And** all elements should support dark mode variants

#### Scenario: Apply Nuxt UI colors to timeline notes

**Given** the notes timeline is displayed
**When** viewing individual note entries
**Then** note content should use default text color (text-slate-700 dark:text-slate-300)
**And** date and author text should use text-muted color
**And** primary note dot should use primary color
**And** older note dots should use muted color (bg-slate-300 dark:bg-slate-600)
**And** timeline border should use border-default color
**And** container background should use bg-default
**And** all elements should support dark mode variants

#### Scenario: Ensure dark mode compatibility

**Given** the application is in dark mode
**When** viewing the "Notes & Follow-up" section
**Then** all colors should automatically switch to dark variants
**And** card background should use dark variant (dark:bg-slate-800/50)
**And** borders should use dark variant (dark:border-slate-700/50)
**And** text should use appropriate dark variants for readability
**And** visual elements should maintain proper contrast

### Requirement: Component Interface Preservation

The component MUST maintain all existing props and events interface to ensure compatibility with parent components.

#### Scenario: Preserve existing props interface

**Given** the PatientTreatmentPlanSidebar component is updated
**When** the component is used with existing props (patient, treatmentPlan)
**Then** the component should accept all existing props without modification
**And** the component should render correctly with existing prop values
**And** no new required props should be added

#### Scenario: Preserve existing events interface

**Given** the PatientTreatmentPlanSidebar component is updated
**When** parent components emit events (edit-plan, create-new)
**Then** all existing events should continue to function
**And** event emissions should use the same event names
**And** event payloads should remain unchanged

