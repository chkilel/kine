# Replace Timer Management with Database-Backed Implementation

## Why

The current consultation timer in `ActiveConsultationSlideover.vue` is purely client-side and doesn't persist pause/resume state or actual therapy time to the database. This prevents cross-device synchronization and accurate tracking of session duration when sessions span across devices or need to handle pauses. The timer relies on scheduled `startTime` which doesn't reflect actual start time, leading to inaccurate elapsed time tracking.

## What Changes

- **Database Schema**: Add 5 new fields to `consultations` table for session tracking:
  - `actualStartTime`: Actual time when therapy session began (HH:MM:SS format)
  - `actualDurationSeconds`: Actual therapy time in seconds (excluding pauses)
  - `totalPausedSeconds`: Cumulative pause duration in seconds
  - `pauseStartTime`: Timestamp when current pause began (or null if running)
  - `tags`: JSON array of smart tags for session classification

- **Time Utilities**: Create `app/utils/time.ts` with helper functions for:
  - Getting current time in HH:MM:SS format
  - Calculating time differences between time strings
  - Formatting seconds as MM:SS or HH:MM:SS
  - Calculating time since pause began in human-readable format

- **API Endpoints**: Create 5 new endpoints for session lifecycle management:
  - `POST /api/consultations/[id]/start`: Start session with actual start time
  - `POST /api/consultations/[id]/pause`: Pause session with pause start time
  - `POST /api/consultations/[id]/resume`: Resume session and accumulate paused time
  - `POST /api/consultations/[id]/end`: End session and calculate final duration
  - `PATCH /api/consultations/[id]/tags`: Update smart tags with auto-save

- **Component Updates**: Replace client-side timer in `ActiveConsultationSlideover.vue`:
  - Load session state from database on component mount
  - Calculate actual elapsed time based on `actualStartTime` minus `totalPausedSeconds`
  - Implement pause/resume buttons that call API endpoints
  - Display "En pause depuis X" when paused
  - Implement smart tags as selectable buttons with auto-save to database
  - **Tag options are hardcoded** in component template (not stored in database):
    - Predefined options: "Douleur Diminuée", "Gain Amplitude", "Proprioception", "Cryothérapie", "Renforcement"
    - Tag selection state persists to database
    - Future enhancement: Tag management UI to customize options per organization
  - Add periodic sync (30s) for cross-device state updates

- **Cross-Device Sync**: Enable last-write-wins pattern where multiple devices can control session:
  - Pause on device A, resume on device B
  - Timer calculations match across all devices
  - Smart tags sync immediately across devices

## Impact

- **Affected specs**:
  - `consultation-planning` (modify): Update to use new start session endpoint
  - `therapist-daily-schedule` (modify): Update to use new start session endpoint
  - `session-timer-management` (new): Define requirements for timer functionality
  - `consultation-smart-tags` (new): Define requirements for smart tags feature

- **Affected code**:
  - `server/database/schema/consultation.ts`: Add 5 new session tracking fields
  - `app/utils/time.ts`: New utility module (create)
  - `app/components/consultation/ActiveConsultationSlideover.vue`: Replace timer logic
  - `app/pages/therapists/day.vue`: Update start consultation handler
  - `app/components/consultation/PlanningSlideover.vue`: Update start consultation handler
  - `server/api/consultations/[id]/start.post.ts`: New endpoint (create)
  - `server/api/consultations/[id]/pause.post.ts`: New endpoint (create)
  - `server/api/consultations/[id]/resume.post.ts`: New endpoint (create)
  - `server/api/consultations/[id]/end.post.ts`: New endpoint (create)
  - `server/api/consultations/[id]/tags.patch.ts`: New endpoint (create)

- **Dependencies**:
  - Add `@internationalized/date` package for time parsing

- **Migration**: Database migration required to add 5 new nullable fields to consultations table

- **User Experience**:
  - Therapists can pause and resume sessions with accurate time tracking
  - Sessions can be controlled from multiple devices (phone, tablet, desktop)
  - Smart tags are saved immediately and persist across refreshes
  - Actual therapy time is tracked separately from scheduled time
  - Timer shows accurate elapsed time excluding pause duration

- **Data Integrity**:
  - Actual therapy time is calculated and stored separately
  - Pause duration is accumulated across multiple pause/resume cycles
  - Session state is preserved if browser is closed or refreshed

## Design Decisions

### Hardcoded Smart Tags

Tag options are **hardcoded in the component template** rather than stored in database. This keeps the implementation simple and focused on timer management.

**Predefined tag options:**

- Douleur Diminuée
- Gain Amplitude
- Proprioception
- Cryothérapie
- Renforcement

**Future Enhancement:**
A separate change proposal could add:

- Database table for tag management (e.g., `consultation_tags` or organization-level config)
- UI for adding/removing/customizing tags per organization
- Support for custom therapist-created tags during sessions

**Current scope:**
This proposal focuses only on timer management and storing selected tags to the consultations table. Tag option management is intentionally out of scope to keep the change size manageable.
