## 1. Component UI Structure Update

- [x] 1.1 Replace current notes section (lines 193-212) with new interactive UI structure
- [x] 1.2 Implement textarea with proper styling and placeholder "Ajouter une note clinique..."
- [x] 1.3 Add send button with icon positioned absolutely in bottom-right of textarea
- [x] 1.4 Create scrollable container for existing notes with max-height [250px]
- [x] 1.5 Ensure all component props and events remain unchanged

## 2. Timeline UI Implementation

- [x] 2.1 Implement timeline structure with left border line for each note
- [x] 2.2 Add visual dot indicators for each note (primary color for latest, muted color for older notes)
- [x] 2.3 Style note content with proper spacing and typography
- [x] 2.4 Format date display using existing formatFrenchDate utility
- [x] 2.5 Display author name in muted text

## 3. Nuxt UI Color System Application

- [x] 3.1 Replace hardcoded colors with Nuxt UI design system colors:
  - Use `text-primary` for primary elements and icons
  - Use `text-muted` for secondary text and descriptions
  - Use `bg-default` for card background
  - Use `border-default` for consistent borders
  - Use `bg-muted` for textarea background
- [x] 3.2 Ensure dark mode compatibility with appropriate dark variants
- [x] 3.3 Match styling consistency with other sections in the component
- [x] 3.4 Apply proper hover states and transition effects

## 4. Form Interaction Implementation

- [x] 4.1 Create reactive state for new note input
- [x] 4.2 Implement note submission handler with validation
- [x] 4.3 Add toast notification on successful note submission
- [x] 4.4 Clear textarea after successful submission
- [x] 4.5 Update treatmentPlan.notes array with new note

## 5. Note Display Logic

- [x] 5.1 Sort notes by date (newest first) for timeline display
- [x] 5.2 Handle empty state with appropriate message when no notes exist
- [x] 5.3 Apply proper spacing between notes
- [x] 5.4 Ensure proper scroll behavior with custom scrollbar styling
- [x] 5.5 Handle loading state for async operations

## 6. API Integration

- [x] 6.1 Use existing `useUpdateTreatmentPlan` composable for note submission
- [x] 6.2 Call PUT `/api/treatment-plans/[id]` endpoint
- [x] 6.3 Pass planId and updated notes array in data
- [x] 6.4 Use onSuccess callback to clear input and reset loading state
- [x] 6.5 Implement manual loading state management for better UX

## 7. Testing and Validation

- [x] 7.1 Verify all existing props and events work unchanged
- [x] 7.2 Test note addition with valid and empty inputs
- [x] 7.3 Verify note persistence and display after adding
- [x] 7.4 Test responsive design across different screen sizes
- [x] 7.5 Verify dark mode color scheme works correctly
- [x] 7.6 Test component integration with parent components
- [x] 7.7 Verify TypeScript type checking passes
