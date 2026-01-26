# Design: Active Consultation Slideover

## Overview

The active consultation slideover provides a fullscreen, immersive interface for therapists during consultations. It consolidates patient information, consultation documentation tools, and consultation controls into a single focused workspace using Nuxt UI components and design language.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Patient name + "Séance Active" + Live indicator          │
├─────────────────┬───────────────────────────┬──────────────────────┤
│                 │                           │                      │
│  Patient Info   │   Main Content Area       │   Consultation Controls  │
│  (25% width)   │   (50% width)            │   (25% width)       │
│                 │                           │                      │
│  - Photo        │   - Pain Level (EVA)      │   - Timer (large)   │
│  - Name/Age     │   - Notes Editor          │   - Pause button    │
│  - Diagnosis    │   - Smart Tags            │   - Stop button     │
│  - Alerts      │                           │                      │
│  - Stats       │                           │   - Previous Notes   │
│                 │                           │   - Complete button  │
└─────────────────┴───────────────────────────┴──────────────────────┘
```

## Component Architecture

```
ActiveConsultationSlideover.vue
├── PatientSidebar.vue
│   ├── PatientProfileCard
│   ├── DiagnosisCard
│   ├── MedicalAlertCard
│   └── ProgressStatsCard
├── ConsultationContent.vue
│   ├── PainLevelInput (EVA 0-10)
│   ├── NotesEditor (rich text)
│   └── SmartTagsSelector
└── ConsultationControls.vue
    ├── ConsultationTimer
    ├── ConsultationActions (pause/stop)
    ├── PreviousConsultationNotes (expandable)
    └── CompleteConsultationButton
```

## Nuxt UI Component Usage

### Layout

- `USlideover` - Main container with fullscreen mode
- `UCard` - Section containers with consistent styling
- `UCol` / `URow` or Tailwind grid - Responsive layout

### Patient Sidebar

- `UAvatar` - Patient photo with gradient background
- `UBadge` - Status indicators, diagnostic tags
- `UAlert` - Medical alerts (red for allergies/warnings)
- `UProgress` - Treatment plan progress bar
- `UIcon` - Icons for sections

### Session Content

- `UButtonGroup` - Pain level buttons (0-10)
- `UButton` - Individual pain level options with emoji
- `UTabs` or `USlideover` - Notes editor tabs (optional)
- `UButton` - Smart tags with add icon
- `UTextarea` or rich text editor component - Notes input

### Session Controls

- `UIcon` + custom timer display - Large countdown timer
- `UButton` (circular) - Pause and stop actions
- `UAccordion` or `UCollapsible` - Previous session notes
- `UButton` (block, large) - Complete session primary action

## Color Usage (Nuxt UI)

- **Primary** (blue) - Main actions, headers, active states
- **Success** (green) - Timer display, completion, positive indicators
- **Error** (red) - Medical alerts, stop action, severe pain (8-10)
- **Warning** (yellow) - Moderate pain (4-7), session ending soon
- **Neutral/Gray** - Secondary text, borders, inactive states
- **Background colors** - Use Nuxt UI semantic colors (bg-elevated, bg-muted)

## State Management

### Component Props

```typescript
interface Props {
  consultation: Consultation
  patient: Patient
  treatmentPlan?: TreatmentPlanWithProgress | null
  previousConsultations?: Consultation[]
}
```

### Component Emits

```typescript
interface Emits {
  close: [consultationData?: ConsultationData]
  complete: [consultationData: ConsultationData]
  pause: []
  stop: []
}
```

### Reactive State

- `timer` - Consultation duration elapsed/remaining
- `isPaused` - Pause state
- `painLevelBefore` - Current EVA selection
- `consultationNotes` - Rich text content
- `selectedTags` - Smart tags for notes
- `showPreviousNotes` - Expand/collapse previous notes

## Data Flow

1. **Opening**: Therapist clicks "Démarrer" → Opens slideover → Starts timer → Sets status to 'in_progress'
2. **During Consultation**:
   - Therapist selects pain level → Updates `painLevelBefore`
   - Therapist types notes → Auto-saves to `notes` field
   - Therapist adds tags → Appends to notes or stores separately
   - Timer updates every second
3. **Completing**: Therapist clicks "Terminer" → Opens completion confirmation → Updates `painLevelAfter` (optional) → Saves all consultation data → Sets status to 'completed' → Closes slideover

## Integration Points

### Existing Components

- `LazyAppModalConfirm` - For consultation completion confirmation
- `useOverlay` - For slideover management
- `useUpdateConsultationStatus` - For status transitions
- New: `useActiveConsultation` or update existing `useConsultations` composable

### API Endpoints (existing)

- `PUT /api/patients/[id]/consultations/[consultationId]` - Update consultation data
- `GET /api/patients/[id]/consultations` - Fetch previous consultations

## Responsive Design

- **Desktop (>1024px)**: Three-column layout as shown above
- **Tablet (768-1024px)**: Stacked layout with patient info on top
- **Mobile (<768px)**: Single column with accordion sections for patient info, controls

## Accessibility

- Keyboard navigation for pain level buttons (0-9, number keys)
- ARIA labels for timer and controls
- Focus management when slideover opens/closes
- High contrast for pain level buttons (emoji + number + color)
