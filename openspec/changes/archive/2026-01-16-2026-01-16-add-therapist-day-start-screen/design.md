# Design: Therapist Day Start Screen

## Overview

The therapist day start screen provides a centralized view of a therapist's daily schedule, showing all programmed consultations in chronological order with key information needed to prepare for each session. The screen includes summary statistics, date navigation, and quick access to patient and consultation details.

## Architecture

### Page Structure

```
app/pages/therapists/day.vue
├── Date navigation header
├── Summary statistics
├── Consultations list (chronological)
└── Empty state
```

### Data Flow

```
1. User navigates to /therapists/day
2. Page reads date from URL query param (defaults to today)
3. Composable fetches consultations for current user on selected date
4. API endpoint returns consultations with patient and room data
5. Page displays consultations in chronological order
6. User can navigate between dates
```

## Component Design

### 1. Page: `/app/pages/therapists/day.vue`

**Purpose**: Main therapist day view page

**Data fetching**:

- Use composable `useTherapistConsultations(date)`
- Fetch consultations for authenticated therapist
- Filter by date parameter

**Layout**:

- Header with date navigation (previous/next day, date picker)
- Summary cards showing:
  - Total consultations
  - Completed consultations
  - Upcoming consultations
  - Cancelled/no-show consultations
- Timeline/list view of consultations sorted by time
- Each consultation card displays:
  - Time range
  - Patient name
  - Consultation type
  - Status badge
  - Room name
  - Treatment plan (if applicable)
  - Action buttons (based on status):
    - "Start Session" button (for scheduled/confirmed consultations)
    - "View Details" button (for all consultations)

**Navigation**:

- Click patient name → `/patients/[id]`
- Click "View Details" button → `/patients/[patientId]/consultations/[consultationId]`
- Click "Start Session" button → Updates consultation status to "in_progress" with confirmation

**Rationale**: Simple, focused page that provides quick access to all daily consultations without overwhelming the therapist with too much detail.

### 2. Composable: `/app/composables/useTherapistConsultations.ts`

**Purpose**: Fetch consultations for the current therapist on a given date

**Interface**:

```typescript
const useTherapistConsultations = (date: MaybeRefOrGetter<string>) => {
  const { user } = useAuth()
  return useQuery({
    key: ['therapist-consultations', toValue(user)?.id, date],
    query: async () => {
      return await requestFetch('/api/therapists/consultations', {
        query: { date: toValue(date) }
      })
    },
    enabled: () => !!toValue(user)?.id
  })
}
```

**Rationale**: Centralized data fetching logic that can be reused and cached properly. Uses authenticated user's ID automatically.

### 3. API Endpoint: `/server/api/therapists/consultations/index.get.ts`

**Purpose**: Return consultations for the authenticated therapist on a specific date

**Query parameters**:

- `date`: YYYY-MM-DD format (required)

**Response**:

```typescript
{
  id: string
  patientId: string
  patientName: string
  treatmentPlanId: string | null
  roomId: string | null
  roomName: string | null
  date: string
  startTime: string
  endTime: string
  duration: number
  type: ConsultationType
  status: ConsultationStatus
  chiefComplaint: string | null
}
```

**Implementation**:

1. Get authenticated user from session
2. Validate date parameter
3. Query consultations table with joins to patients and rooms
4. Filter by therapistId (from auth user) and date
5. Order by startTime
6. Return array of consultations with patient and room names

**Rationale**: Single endpoint optimized for the therapist's daily view, returning all needed data in one request to minimize API calls.

### 4. Status Update Using Existing Endpoint

**Rationale**: The existing `PUT /api/patients/[id]/consultations/[consultationId]` endpoint can update any consultation field including status via `consultationUpdateSchema.partial()`. No new endpoint is needed.

**Usage**:

```typescript
const useUpdateConsultationStatus = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      patientId,
      consultationId,
      status
    }: {
      patientId: string
      consultationId: string
      status: ConsultationStatus
    }) =>
      requestFetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'PUT',
        body: { status }
      }),
    onSuccess: (_, { patientId }) => {
      toast.add({
        title: 'Succès',
        description: 'Statut de la consultation mis à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['therapist-consultations'] })
      queryCache.invalidateQueries({ key: ['consultations', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le statut').message,
        color: 'error'
      })
    }
  })
}
```

**Rationale**: Reuses existing PUT endpoint for status updates, maintaining consistency with the existing API. The `consultationUpdateSchema` is built from `consultationCreateSchema.partial()`, which includes the `status` field as optional.

## Session Start Workflow

### Flow for Starting a Session

```
1. Therapist sees consultation card with "Start Session" button
2. Therapist clicks "Start Session" button
3. System shows confirmation dialog:
   "Démarrer la consultation avec [Patient Name] à [Start Time] ?"
4. Therapist confirms
5. System updates consultation status to "in_progress"
6. System refreshes the daily view list
7. Consultation card now shows status "En cours" with different button options:
   - "Complete Session" button
   - "View Details" button
```

### Button Display Logic

**"Start Session" button**:

- Visible when status is `scheduled` or `confirmed`
- Button style: Primary action (solid color)
- Icon: Play icon

**"Complete Session" button**:

- Visible when status is `in_progress`
- Button style: Success color
- Icon: Check icon

**"View Details" button**:

- Always visible on consultation cards
- Button style: Secondary/ghost
- Icon: Eye icon

### Consultation Details Page Integration

**Rationale**: Support session starting from both locations for flexibility.

**Implementation**:

- Reuse `useUpdateConsultationStatus` composable
- Add "Start Session" button on consultation details page (when status is `scheduled` or `confirmed`)
- Add "Complete Session" button on consultation details page (when status is `in_progress`)
- Same status update logic, same API endpoint

## Technology Decisions

### 1. Date Parameter as URL Query

**Decision**: Use URL query parameter `?date=2026-01-16` for date selection

**Rationale**:

- Shareable URLs (can send someone a link to a specific day's schedule)
- Browser back/forward navigation works naturally
- State can be restored on page refresh

**Alternative**: Local state only
**Rejected**: Less user-friendly, can't bookmark or share specific dates

### 2. Chronological Ordering

**Decision**: Always display consultations in chronological order by startTime

**Rationale**:

- Natural way therapists think about their day
- Easier to prepare for sessions sequentially
- Consistent with calendar views

### 3. Summary Statistics

**Decision**: Show summary cards at the top of the page

**Rationale**:

- Quick overview of daily workload
- Helps therapists identify busy vs. light days
- Provides at-a-glance status of the day

**Fields to show**:

- Total consultations for the day
- Completed consultations count
- Upcoming consultations count
- Cancelled/no-show count

### 4. Consultation Card Design

**Decision**: Use consultation card component from existing design system

**Rationale**:

- Consistent UI across the application
- Leverage existing component (`ConsultationCard.vue`)
- Reduces development time

**Modifications needed**:

- Simplified view for daily overview (less detail than full consultation card)
- Remove edit/actions buttons (view-only for this screen)
- Optimize for scanning multiple consultations quickly

### 5. Navigation to Patient Details

**Decision**: Click patient name → navigate to patient page

**Rationale**:

- Allows therapists to quickly review patient history before sessions
- Natural navigation pattern
- Patient page already exists and is well-designed

### 6. Navigation to Consultation Details

**Decision**: Click anywhere on consultation card → navigate to consultation details

**Rationale**:

- Full access to consultation data (notes, treatment summary, etc.)
- Can view or edit consultation details
- Consistent with existing navigation patterns

## Data Structure

### API Response Schema

```typescript
interface TherapistConsultation {
  id: string
  patientId: string
  patientName: string // Joined from patients table
  treatmentPlanId: string | null
  roomId: string | null
  roomName: string | null // Joined from rooms table
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration: number // minutes
  type: ConsultationType
  status: ConsultationStatus
  chiefComplaint: string | null
  location: ConsultationLocation
}
```

### Query Logic

```sql
SELECT
  c.id,
  c.patientId,
  p.firstName || ' ' || p.lastName as patientName,
  c.treatmentPlanId,
  c.roomId,
  r.name as roomName,
  c.date,
  c.startTime,
  c.endTime,
  c.duration,
  c.type,
  c.status,
  c.chiefComplaint,
  c.location
FROM consultations c
LEFT JOIN patients p ON c.patientId = p.id
LEFT JOIN rooms r ON c.roomId = r.id
WHERE c.therapistId = :therapistId
  AND c.organizationId = :organizationId
  AND c.date = :date
ORDER BY c.startTime ASC
```

## UI Layout

### Header Section

```
┌─────────────────────────────────────────────────────────────┐
│ Therapist Schedule                     [<-] [Jan 16, 2026] [->]│
└─────────────────────────────────────────────────────────────┘
```

### Summary Section

```
┌────────────┬────────────┬────────────┬────────────┐
│ Total      │ Completed  │ Upcoming   │ Cancelled  │
│ 8          │ 3          │ 4          │ 1          │
└────────────┴────────────┴────────────┴────────────┘
```

### Consultations List

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 09:00 - 10:00  |  John Doe        | [Suivi]    [À venir]    [▶ Démarrer][👁 Voir]│
│ 10:15 - 11:15  |  Jane Smith      | [Suivi]    [À venir]    [▶ Démarrer][👁 Voir]│
│ 11:30 - 12:30  |  Bob Johnson     | [Évaluation][Confirmée]    [▶ Démarrer][👁 Voir]│
│ 14:00 - 15:00  |  Alice Brown     | [Suivi]    [En cours]    [✓ Terminer][👁 Voir]│
│ 15:30 - 16:30  |  Charlie Green  | [Suivi]    [Terminée]    [👁 Voir]│
└───────────────────────────────────────────────────────────────────────────────┘
```

**Button states**:

- `[▶ Démarrer]` - For `scheduled` or `confirmed` status (Start button with play icon)
- `[✓ Terminer]` - For `in_progress` status (Complete button with check icon)
- `[👁 Voir]` - Always visible (View details button with eye icon)

### Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│      No consultations scheduled for this day                │
│                                                             │
│      [Add Consultation]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

1. **Authentication required**:
   - If user is not authenticated, redirect to login
   - Better Auth handles this automatically

2. **Invalid date parameter**:
   - Return HTTP 400 Bad Request
   - Error message: "Date invalide"

3. **No consultations found**:
   - Return empty array
   - Display friendly empty state UI

4. **API errors**:
   - Show toast notification
   - Display retry button
   - Log error for debugging

## Security Considerations

1. **Therapist isolation**:
   - Only return consultations for the authenticated therapist
   - Cannot view other therapists' schedules
   - Better Auth ensures session is tied to correct user

2. **Organization isolation**:
   - Filter by organizationId from user's session
   - Prevent cross-organization data access

3. **No sensitive data**:
   - Only show relevant consultation details
   - Exclude progress notes, treatment summaries from overview
   - Full details available on consultation details page

## Performance Considerations

1. **Single API call**:
   - Fetch all needed data in one request
   - Use SQL joins to get patient and room names
   - Avoid multiple API calls per consultation

2. **Query caching**:
   - Use VueQuery caching with date key
   - Reuse cached data when navigating between tabs/views
   - Invalidate cache when consultation data changes

3. **Indexing**:
   - Leverage existing index: `idx_consultations_org_therapist_date_status`
   - Optimizes WHERE clause: organizationId + therapistId + date

## Future Enhancements

1. **Week view**: Option to see full week at a glance
2. **Quick actions**: Start session, mark complete from daily view
3. **Patient prep notes**: Custom notes therapists can add for each patient
4. **Print/export**: Export daily schedule as PDF
5. **Time blocking**: Visual calendar view instead of list
6. **Filter by status**: Show only upcoming, only completed, etc.
7. **Consultation notes preview**: Show brief notes preview on card hover
