# Design: Consultation Dedicated Page

## Overview

A dedicated page for managing consultations with a 4-step clinical workflow, using URL query parameters to manage state and navigation.

## URL Structure

```
/consultations/[id]?step=pre-session
/consultations/[id]?step=active-session
/consultations/[id]?step=post-session
/consultations/[id]?step=summary
```

Default to `pre-session` if no step provided.

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Patient Name • Consultation Type • Date                   │
│  Breadcrumb: Accueil > Planning > Séance [ID]                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step Progress Bar:                                                 │
│  [● Pre-Session] → [○ Active Session] → [○ Post-Session] → [○ Summary] │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step Content (dynamic based on step query param)                  │
│                                                                     │
│  ┌─────────┬───────────────────────────┬──────────────────────────┐│
│  │ Patient │   Main Content Area       │   Consultation Controls ││
│  │ Info    │   (varies by step)        │   (varies by step)       ││
│  │ (25%)   │   (50%)                   │   (25%)                  ││
│  │         │                           │                          ││
│  │  Always  │   Step-specific:         │   Step-specific:         ││
│  │  visible  │   • Pre: EVA input       │   • Pre: Disabled timer ││
│  │           │   • Active: Notes + tags │   • Active: Timer + actions│
│  │           │   • Post: EVA final      │   • Post: Confirm button ││
│  │           │   • Summary: Charts      │   • Summary: Billing    ││
│  │           │                           │                          ││
│  └─────────┴───────────────────────────┴──────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
/pages/consultations/[id].vue
├── ConsultationPatientInfoSidebar.vue (always visible)
├── ConsultationStepProgress.vue (progress bar)
└── ConsultationStepContainer.vue
    ├── PreSessionStep.vue
    │   └── ConsultationEvaCard.vue (existing)
    ├── ActiveSessionStep.vue
    │   ├── ConsultationEditor.vue (existing)
    │   └── ConsultationTimerCard.vue (existing)
    ├── PostSessionStep.vue
    │   ├── ConsultationEvaFinalCard.vue (NEW)
    │   ├── PainDifferentialDisplay.vue (NEW)
    │   └── ConsultationNotesReview.vue (existing)
    └── SummaryStep.vue
        ├── ConsultationAnalyticsChart.vue (NEW)
        ├── ConsultationBillingSection.vue (NEW)
        └── NextAppointmentBooking.vue (NEW)
```

## Step-by-Step Design

### Step 1: Pre-Session (Locked State)

**URL**: `/consultations/[id]?step=pre-session`

**Purpose**: Capture initial pain level before session starts

**State**:

- `painLevelBefore`: number | undefined
- `evaValidated`: boolean
- `evaEnabled`: boolean (optional bypass)

**Layout**:

```
┌─────────────────┬───────────────────────────┬──────────────────────────┐
│ Patient Profile │   EVA Input Card          │   Timer (Disabled)       ││
│ - Name, Age     │   Slider 0-10             │   Planned duration        ││
│ - Diagnosis     │   Validate button         │   "Start" button         ││
│ - Alerts        │   (or disable EVA)        │   Disabled until EVA      ││
│ - Progress      │                           │   validated              ││
└─────────────────┴───────────────────────────┴──────────────────────────┘
```

**Actions**:

- Slide EVA to capture pain level
- Click "Valider" to enable session start
- (Optional) Toggle "Évaluation Non nécessaire"

**Next Step**: Click "Démarrer" → navigate to `?step=active-session`

---

### Step 2: Active Session (Running State)

**URL**: `/consultations/[id]?step=active-session`

**Purpose**: Document treatment while session is in progress

**State**:

- `timer`: running/paused
- `notes`: string (auto-saved)
- `selectedTags`: string[] (auto-saved)

**Layout**:

```
┌─────────────────┬───────────────────────────┬──────────────────────────┐
│ Patient Profile │   Notes Editor             │   Timer (Active)         ││
│ - Always visible│   Rich text area           │   Count down display     ││
│                 │   Smart tags               │   Pause/Resume button    ││
│                 │   Auto-save indicator      │   Stop button            ││
│                 │                           │   Extend button (+5min)  ││
│                 │   Previous Notes (expand) │                          ││
└─────────────────┴───────────────────────────┴──────────────────────────┘
```

**Actions**:

- Type notes (auto-save to consultation)
- Add/remove smart tags (auto-save)
- Pause/resume timer
- Extend session by 5 minutes
- Click "Terminer" → navigate to `?step=post-session`

**Auto-Refresh**:

- Consultation data refreshes every 30s
- Timer updates every second
- Notes/tags save on change

---

### Step 3: Post-Session (Final Assessment)

**URL**: `/consultations/[id]?step=post-session`

**Purpose**: Capture final pain level and review notes

**State**:

- `painLevelAfter`: number | undefined
- `painDifferential`: calculated (painLevelAfter - painLevelBefore)
- `notes`: string (read-only in this step)
- `selectedTags`: string[] (read-only in this step)

**Layout**:

```
┌─────────────────┬───────────────────────────┬──────────────────────────┐
│ Patient Profile │   Final EVA Card           │   Pain Differential       ││
│ - Same as step 2│   Slider 0-10             │   Before: [X]/10         ││
│                 │   Validate button         │   After: [X]/10          ││
│                 │                           │   Difference: [±X]        ││
│                 │   Notes Review            │   (green if improvement)  ││
│                 │   - Read-only notes      │   (red if worse)         ││
│                 │   - Applied tags         │                          ││
│                 │                           │   Confirm & Continue      ││
└─────────────────┴───────────────────────────┴──────────────────────────┘
```

**Actions**:

- Slide EVA to capture final pain level
- Review notes and tags (read-only)
- Click "Confirmer et Continuer" → navigate to `?step=summary`

**Calculation**:

```
painDifferential = painLevelAfter - painLevelBefore
Display color:
  - Green (success): differential < 0 (improvement)
  - Red (error): differential > 0 (worse)
  - Gray (neutral): differential = 0
```

---

### Step 4: Summary (Closure)

**URL**: `/consultations/[id]?step=summary`

**Purpose**: View analytics, handle billing, book next appointment

**State**:

- `consultation`: completed
- `billingStatus`: pending/paid/deposit

**Layout**:

```
┌─────────────────┬───────────────────────────┬──────────────────────────┐
│ Patient Profile │   Analytics Chart         │   Billing Section         ││
│ - Same as step 2│   EVA progress over time  │   Payment amount          ││
│                 │   Session duration        │   Payment method          ││
│                 │   Plan progress %         │   Mark as Paid button     ││
│                 │                           │                          ││
│                 │   Next Appointment        │   Actions:                ││
│                 │   - Quick book button     │   - Back to Dashboard     ││
│                 │   - View calendar         │   - View Patient File     ││
└─────────────────┴───────────────────────────�──────────────────────────┘│
```

**Actions**:

- View EVA progression chart (all sessions)
- Handle billing (mark as paid, record deposit)
- Book next appointment (opens PlanningSlideover)
- Return to dashboard or patient file

---

## State Management

### URL Query Parameters

```typescript
interface ConsultationRouteQuery {
  step: 'pre-session' | 'active-session' | 'post-session' | 'summary'
  // Additional params as needed:
  // ?step=post-session&from=active-session (for back button)
}
```

### Computed Step Detection

```typescript
const step = computed(() => {
  const validSteps = ['pre-session', 'active-session', 'post-session', 'summary']
  const stepFromQuery = route.query.step as string
  return validSteps.includes(stepFromQuery) ? stepFromQuery : 'pre-session'
})
```

### Step Navigation

```typescript
function goToStep(newStep: string) {
  router.push({
    path: route.path,
    query: { ...route.query, step: newStep }
  })
}
```

### Auto-Save Mechanism

Use `watch` with debounce for notes and tags:

```typescript
const { mutate: updateConsultation } = useUpdateConsultation()

watchDebounced(
  [consultationNotes, selectedTags],
  ([notes, tags]) => {
    if (!consultation.value) return
    updateConsultation({
      id: consultation.value.id,
      notes,
      tags: JSON.stringify(tags)
    })
  },
  { debounce: 1000 }
)
```

---

## Responsive Design

### Desktop (>1024px)

- Three-column layout as shown above
- Patient info left, content center, controls right
- Fixed sidebar for patient info

### Tablet (768-1024px)

- Stack patient info on top (collapsible)
- Two-column for content + controls
- Full-width patient info when expanded

### Mobile (<768px)

- Single column with accordion sections
- Patient info collapsible
- Step progress bar becomes stepper
- Bottom navigation for step changes

---

## Integration Points

### From Therapist Day Page

**Before**:

```typescript
activeConsultationOverlay.open({
  patientId: consultation.patientId,
  consultationId: consultation.id
})
```

**After**:

```typescript
navigateTo(`/consultations/${consultation.id}`)
```

### From Planning Slideover

**Before**:

```typescript
activeConsultationOverlay.open({
  patientId: props.patient.id,
  consultationId: props.consultation.id
})
emit('close')
```

**After**:

```typescript
navigateTo(`/consultations/${props.consultation.id}`)
emit('close')
```

### From Patient Sessions Tab

Add button to "View Active Session" if status is `in_progress`:

```typescript
const activeConsultation = computed(() => consultations.value?.find((c) => c.status === 'in_progress'))

function viewActiveSession() {
  if (activeConsultation.value) {
    navigateTo(`/consultations/${activeConsultation.value.id}`)
  }
}
```

---

## Accessibility

- Keyboard navigation for all steps
- ARIA labels for step progress
- Focus management when changing steps
- High contrast for pain level inputs
- Screen reader support for timer display
- Skip to content link for patient info sidebar

---

## Migration Strategy

### Phase 1: Create Page Structure

- Create `/pages/consultations/[id].vue`
- Migrate existing child components
- Implement pre-session and active-session steps

### Phase 2: Add Missing Steps

- Create PostSessionStep with EVA final capture
- Create SummaryStep with analytics and billing
- Implement pain differential calculation

### Phase 3: Update Integration Points

- Replace overlay.open() with navigateTo()
- Update `day.vue`
- Update `PlanningSlideover.vue`
- Add navigation from patient sessions tab

### Phase 4: Testing & Documentation

- Test all steps end-to-end
- Test URL navigation and recovery
- Test responsive design
- Update component documentation

### Optional: Keep Slideover for Read-Only

Keep `ActiveConsultationSlideover` as a "Quick View" for completed consultations (read-only mode only).
