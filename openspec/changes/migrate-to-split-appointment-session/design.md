# Design: Split Appointment-Treatment Session Architecture

## Context

The current system stores both scheduling data (when, where, with whom) and clinical session data (pain levels, notes, timer state) in the `appointments` table. This design has worked for simple use cases but creates problems as the system grows:

1. **Mixed Lifecycles**: An appointment exists from booking until the scheduled time, but clinical data only exists once therapy starts
2. **Unclear Responsibilities**: The `in_progress` status currently lives on appointments but should represent an active clinical session
3. **Future Requirements**: Walk-in patients, group sessions, and session rescheduling all benefit from clearer separation

The new schema creates this separation:

- **Appointments**: Scheduling domain - date, time, room, patient, therapist, status (scheduled/confirmed/cancelled/no_show/completed)
- **Treatment Sessions**: Clinical domain - timer state, notes, pain levels, observations, status (in_progress/completed)

## Goals

1. Create treatment session lazily when therapist clicks "Start Session"
2. Move all clinical data and timer state to treatment session
3. Keep appointment as scheduling reference only
4. Maintain 1:0..1 relationship (one appointment can have at most one treatment session)
5. Preserve existing UX while changing underlying data model

## Non-Goals

1. Not adding new clinical features (just moving existing ones)
2. Not changing the UI design or workflow
3. Not supporting multiple treatment sessions per appointment (future consideration)
4. Not handling historical data migration (clean slate approach for development)

## Decisions

### Decision 1: Lazy Creation of Treatment Sessions

**Decision**: Treatment sessions are created when the therapist clicks "Start Session", not at appointment creation.

**Rationale**:

- Aligns with business reality - no clinical session exists before therapy starts
- Prevents orphaned treatment sessions for cancelled appointments
- Simplifies appointment creation flow

**Alternative considered**: Create treatment session at appointment time with null fields - rejected due to unnecessary records and complexity.

### Decision 2: Status Separation

**Decision**: Appointments keep scheduling status (scheduled, confirmed, cancelled, no_show, completed); Treatment sessions have clinical status (in_progress, completed).

**Flow**:

- Appointment starts as 'scheduled' → becomes 'confirmed' → when treatment session completes, appointment becomes 'completed'
- This allows quick scheduling views without joining treatment sessions

**Rationale**:

- Clear separation of concerns
- An appointment can be "confirmed" while treatment session is "in_progress"
- Allows tracking that a patient didn't show up (appointment cancelled) without creating a treatment session

**Alternative considered**: Keep single status field - rejected due to mixed semantics.

### Decision 3: Denormalized References

**Decision**: Treatment session table has patientId, therapistId, treatmentPlanId (copied from appointment) for query efficiency.

**Rationale**:

- Common queries like "patient's treatment history" don't need to join through appointments
- Keeps sessions queryable independently
- Small storage cost for significant query simplification

**Trade-off**: Data could theoretically drift if appointment changes (we'll prevent this with application logic).

### Decision 4: Session Steps Field

**Decision**: Add `sessionStep` enum field (pre-session, assessment, treatment, etc.) to treatment session.

**Rationale**:

- Supports future guided therapy workflows
- Allows UI to adapt based on session phase
- No current use but included in schema for forward compatibility

### Decision 5: API Endpoint Strategy

**Decision**: Create new `/api/treatment-sessions` endpoints rather than extending appointments API.

**Rationale**:

- Clear domain boundaries in API design
- Easier to reason about permissions (who can create/modify sessions)
- Supports future independent queries (e.g., all sessions for a patient)

**Endpoints needed**:

- `POST /api/treatment-sessions` - Create from appointment (lazy creation)
- `GET /api/treatment-sessions/[id]` - Get session details
- `PATCH /api/treatment-sessions/[id]` - Update session (timer actions, notes, etc.)
- `GET /api/treatment-sessions?patientId=xxx` - List patient sessions

### Decision 6: Frontend Composable Strategy

**Decision**: Create `useTreatmentSession` composable separate from `useAppointment`.

**Rationale**:

- Matches backend domain separation
- Allows independent caching and revalidation
- Components can subscribe to only what they need

**Implementation**:

- `useAppointment` - scheduling data only
- `useTreatmentSession` - clinical data + actions
- `useStartSession` - action that creates treatment session from appointment

### Decision 7: Clean Implementation Approach

**Decision**: Direct replacement without backwards compatibility.

**Rationale**:

- Project is in active development
- No production data to migrate
- Simpler to implement and reason about
- No feature flags or dual-code paths needed

**Implementation**:

- Modify files directly (no deprecation period)
- Delete old code immediately
- Update all types at once
- Single deployment (backend + frontend together)

## Data Flow

### Starting a Session (New Flow)

```
Therapist clicks "Start Session" on appointment
    ↓
Frontend calls POST /api/treatment-sessions
    ↓
Backend creates treatment session record:
  - appointmentId = appointment.id
  - patientId = appointment.patientId (denormalized)
  - therapistId = appointment.therapistId (denormalized)
  - status = 'in_progress'
  - actualStartTime = current time
  - sessionStep = 'pre-session'
    ↓
Backend updates appointment.status = 'confirmed' (keeps scheduling context)
    ↓
Frontend receives treatment session, opens slideover
    ↓
Slideover uses treatment session ID for timer, notes, etc.
```

### During Session

```
Timer actions (pause/resume) → PATCH /api/treatment-sessions/[id]
Notes updates → PATCH /api/treatment-sessions/[id]
Pain level updates → PATCH /api/treatment-sessions/[id]
Tag updates → PATCH /api/treatment-sessions/[id]
```

### Completing Session

```
Therapist clicks "Complete"
    ↓
Frontend calls PATCH /api/treatment-sessions/[id] with status: 'completed'
    ↓
Backend updates:
  - treatment session status = 'completed'
  - treatment session actualDurationSeconds = calculated
  - treatment session sessionStep = 'documentation'
  - appointment status = 'completed' (for scheduling view)
    ↓
Slideover closes, daily view refreshes
```

## Risks / Trade-offs

### Risk 1: Increased Query Complexity

**Risk**: Joining appointments + treatment sessions could be slower than single table.

**Mitigation**:

- Denormalized fields on treatment session reduce joins
- Indexes already defined in schema
- Monitor query performance post-implementation

### Risk 2: Frontend State Synchronization

**Risk**: Two separate data sources (appointment + treatment session) could get out of sync in UI.

**Mitigation**:

- Use Pinia Colada cache invalidation patterns
- Consistent invalidation keys
- Optimistic updates with rollback

## Open Questions

1. **Billing Integration**: Billing currently references appointments. Should it reference treatment sessions instead? (Defer to billing-focused change)

2. **Group Sessions**: Should we support multiple patients per treatment session? (Not in this change - keep 1:1 for now)

3. **Session Templates**: Should pre-session data (planned exercises) be in appointment or treatment session? (Keep in treatment plan for now)

## Implementation Phases

### Phase 1: Backend Foundation

- Create treatment session API endpoints
- Move session action logic from appointments
- Update database schema (remove fields from appointment)

### Phase 2: Frontend Core

- Create useTreatmentSession composable
- Update ConsultationSlideover to use treatment session
- Update ConsultationTimerCard to use treatment session

### Phase 3: Integration

- Update therapist daily view start session flow
- Update type definitions
- Test end-to-end flow

### Phase 4: Cleanup

- Remove old appointment session action code
- Update tests
- Update documentation
