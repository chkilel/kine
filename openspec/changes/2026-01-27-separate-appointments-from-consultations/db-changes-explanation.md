# Database Schema Changes: Step-by-Step Explanation

## Overview

We're splitting the single `consultations` table into **two separate tables**:

```
CURRENT: consultations (1 table)
    ↓
NEW: appointments (scheduling) + consultations (clinical sessions)
```

---

## Step 1: Current Structure (Before Change)

### Single Table: `consultations`

The current table has **23 fields** that serve **two different purposes**:

```sql
consultations
├── Scheduling Fields (appointment concept)
│   ├── id
│   ├── organizationId
│   ├── patientId
│   ├── treatmentPlanId
│   ├── therapistId
│   ├── roomId
│   ├── date           -- "2026-01-27"
│   ├── startTime      -- "10:00"
│   ├── endTime        -- "11:00"
│   ├── duration       -- 60 (minutes)
│   ├── type           -- "follow_up"
│   ├── location       -- "clinic"
│   └── status         -- "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
│
└── Clinical Fields (session concept)
    ├── chiefComplaint
    ├── notes
    ├── treatmentSummary
    ├── observations
    ├── nextSteps
    ├── painLevelBefore
    ├── painLevelAfter
    ├── progressNotes
    ├── actualStartTime      -- "10:05:30" (when therapy actually started)
    ├── actualDurationSeconds -- 2700 (45 minutes actual time)
    ├── totalPausedSeconds   -- 300 (5 minutes paused)
    ├── pauseStartTime      -- "10:30:00" (if paused)
    ├── extendedDurationMinutes
    ├── tags               -- JSON: ["Douleur Diminuée", "Proprioception"]
    ├── billed             -- "2026-01-27"
    ├── insuranceClaimed   -- true
    ├── cost               -- 5000 (€50.00)
    ├── createdAt
    └── updatedAt
```

### Problem with Current Structure

**Example 1: Cancelled Appointment**

```typescript
{
  id: 'abc',
  date: '2026-01-27',
  startTime: '10:00',
  status: 'cancelled',        // Patient cancelled
  painLevelBefore: null,       // Never saw patient
  actualStartTime: null,       // Session never happened
  notes: null,                 // No clinical notes
  // ... other clinical fields are all NULL
}
```

**Issue**: Wasted space, NULL fields for cancelled appointments.

**Example 2: Scheduled Appointment**

```typescript
{
  id: 'def',
  date: '2026-01-28',
  startTime: '14:00',
  status: 'scheduled',        // Tomorrow
  painLevelBefore: null,       // Not yet
  actualStartTime: null,       // Not yet
  notes: null,                 // Not yet
  // ... other clinical fields are all NULL
}
```

**Issue**: Clinical fields don't exist yet but occupy space.

**Example 3: Completed Session**

```typescript
{
  id: 'ghi',
  date: '2026-01-26',
  startTime: '09:00',
  status: 'completed',        // Therapy done
  painLevelBefore: 7,
  painLevelAfter: 4,
  actualStartTime: '09:03:45',
  notes: 'Patient showed improvement...',
  // All fields populated
}
```

**Issue**: All fields used, but `status` mixes appointment (completed) with session (clinical) concepts.

---

## Step 2: New Structure (After Change)

### Two Tables: `appointments` + `consultations`

#### Table 1: `appointments`

**Purpose**: Manages scheduling, booking, and availability.

**Who creates**: When patient/therapist books a time slot.

**When created**: Days/weeks before the actual session.

```sql
appointments
├── Identity
│   ├── id                    -- NEW UUID for appointment
│   ├── organizationId
│   ├── patientId
│   ├── treatmentPlanId
│   ├── therapistId
│   └── roomId
│
├── Scheduling Information
│   ├── date                  -- "2026-01-27"
│   ├── startTime             -- "10:00"
│   ├── endTime               -- "11:00"
│   ├── duration              -- 60 (minutes)
│   ├── type                  -- "follow_up"
│   └── location              -- "clinic"
│
├── Appointment Status (Scheduling Lifecycle)
│   ├── status                -- "scheduled" | "confirmed" | "cancelled" | "no_show" | "linked_to_consultation"
│   ├── confirmedAt           -- When therapist confirmed (timestamp)
│   ├── cancelledAt           -- When cancelled (timestamp)
│   └── noShowReason         -- "Patient called in sick" (text)
│
├── Link to Consultation
│   └── consultationId       -- FK to consultations.id (nullable)
│
└── Timestamps
    ├── createdAt
    └── updatedAt
```

**Total Fields**: 16 (only scheduling + appointment lifecycle)

---

#### Table 2: `consultations`

**Purpose**: Manages actual clinical sessions (treatment documentation).

**Who creates**: When therapist clicks "Start Session" button.

**When created**: At the moment therapy session begins.

```sql
consultations
├── Identity
│   ├── id                    -- NEW UUID for consultation (different from appointment.id!)
│   ├── appointmentId         -- FK to appointments.id (REQUIRED)
│   ├── patientId             -- Copied from appointment (denormalized)
│   ├── treatmentPlanId        -- Copied from appointment (denormalized)
│   └── therapistId           -- Copied from appointment (denormalized)
│
├── Clinical Content
│   ├── chiefComplaint         -- "Lower back pain for 3 months"
│   ├── notes                 -- "Applied manual therapy to lumbar region..."
│   ├── treatmentSummary       -- "Relaxed lumbar muscles, improved mobility"
│   ├── observations          -- "Patient reports reduced stiffness"
│   └── nextSteps            -- "Continue mobility exercises 3x/week"
│
├── Assessment
│   ├── painLevelBefore       -- 7 (0-10 scale)
│   ├── painLevelAfter        -- 4 (0-10 scale)
│   └── progressNotes         -- "Good improvement in range of motion"
│
├── Session Management
│   ├── sessionStep           -- NEW! "pre-session" | "active-session" | "post-session" | "summary"
│   ├── status                -- "in_progress" | "completed"
│   ├── actualStartTime       -- "09:03:45" (when therapy started)
│   ├── actualDurationSeconds -- 2700 (45 minutes actual therapy time)
│   ├── totalPausedSeconds    -- 300 (5 minutes paused total)
│   ├── pauseStartTime        -- "09:30:00" (if currently paused)
│   ├── extendedDurationMinutes -- 0 (extended by X minutes)
│   └── tags                 -- JSON: ["Douleur Diminuée", "Proprioception"]
│
├── Billing (Session-Specific)
│   ├── billed                -- "2026-01-27" (or null if not billed)
│   ├── insuranceClaimed      -- true (submitted to insurance?)
│   └── cost                  -- 5000 (€50.00 in cents)
│
└── Timestamps
    ├── createdAt
    └── updatedAt
```

**Total Fields**: 23 (only clinical + session management)

---

## Step 3: Field-by-Field Mapping

### Scheduling Fields → Move to `appointments`

| Old Field         | New Table                      | Why                                    |
| ----------------- | ------------------------------ | -------------------------------------- |
| `id`              | `appointments.id`              | New UUID for appointment               |
| `organizationId`  | `appointments.organizationId`  | Organization that owns the appointment |
| `patientId`       | `appointments.patientId`       | Patient with appointment               |
| `treatmentPlanId` | `appointments.treatmentPlanId` | Optional treatment plan                |
| `therapistId`     | `appointments.therapistId`     | Therapist scheduled                    |
| `roomId`          | `appointments.roomId`          | Room booked                            |
| `date`            | `appointments.date`            | Appointment date                       |
| `startTime`       | `appointments.startTime`       | Appointment start time                 |
| `endTime`         | `appointments.endTime`         | Appointment end time                   |
| `duration`        | `appointments.duration`        | Planned duration (minutes)             |
| `type`            | `appointments.type`            | Type: "initial", "follow_up", etc.     |
| `location`        | `appointments.location`        | "clinic", "home", "telehealth"         |

**Result**: All scheduling info in one place. Clean queries for availability.

---

### Appointment Status Fields → New in `appointments`

| Old Field        | New Field                   | New Value                | Purpose                            |
| ---------------- | --------------------------- | ------------------------ | ---------------------------------- |
| `status` (mixed) | `appointments.status`       | "scheduled"              | Default when created               |
|                  | `appointments.status`       | "confirmed"              | Therapist confirmed appointment    |
|                  | `appointments.status`       | "cancelled"              | Appointment cancelled              |
|                  | `appointments.status`       | "no_show"                | Patient didn't show up             |
|                  | `appointments.status`       | "linked_to_consultation" | Session started (has consultation) |
| **NEW**          | `appointments.confirmedAt`  | timestamp                | Track when confirmed               |
| **NEW**          | `appointments.cancelledAt`  | timestamp                | Track when cancelled               |
| **NEW**          | `appointments.noShowReason` | text                     | Reason for no-show                 |

**Result**: Clear appointment lifecycle tracking.

---

### Clinical Fields → Move to `consultations`

| Old Field          | New Table                        | Why                                     |
| ------------------ | -------------------------------- | --------------------------------------- |
| `chiefComplaint`   | `consultations.chiefComplaint`   | Main reason for visit                   |
| `notes`            | `consultations.notes`            | Session notes (editable during session) |
| `treatmentSummary` | `consultations.treatmentSummary` | Summary of treatment applied            |
| `observations`     | `consultations.observations`     | Therapist's observations                |
| `nextSteps`        | `consultations.nextSteps`        | Recommendations for next session        |
| `painLevelBefore`  | `consultations.painLevelBefore`  | Pain level before session (0-10)        |
| `painLevelAfter`   | `consultations.painLevelAfter`   | Pain level after session (0-10)         |
| `progressNotes`    | `consultations.progressNotes`    | Progress assessment notes               |

**Result**: All clinical data in one place. Only created if session happens.

---

### Session Management Fields → Move to `consultations`

| Old Field                 | New Table                               | Why                                    |
| ------------------------- | --------------------------------------- | -------------------------------------- |
| `actualStartTime`         | `consultations.actualStartTime`         | When therapy actually started          |
| `actualDurationSeconds`   | `consultations.actualDurationSeconds`   | Actual therapy time (excluding pauses) |
| `totalPausedSeconds`      | `consultations.totalPausedSeconds`      | Cumulative pause time                  |
| `pauseStartTime`          | `consultations.pauseStartTime`          | When current pause began               |
| `extendedDurationMinutes` | `consultations.extendedDurationMinutes` | Session extended beyond planned        |
| `tags`                    | `consultations.tags`                    | Smart tags (JSON array)                |

**Result**: Session timing and management separate from scheduling.

---

### NEW Fields in `consultations`

| New Field     | Type | Purpose                                                            | Example            |
| ------------- | ---- | ------------------------------------------------------------------ | ------------------ |
| `sessionStep` | enum | **Solves your reload problem!** Tracks which step therapist is on: | `"active-session"` |
|               |      | - `"pre-session"`: Before therapy starts (EVA input)               |                    |
|               |      | - `"active-session"`: Therapy in progress (notes, timer)           |                    |
|               |      | - `"post-session"`: After therapy (final EVA)                      |                    |
|               |      | - `"summary"`: Session complete (analytics, billing)               |                    |

**Result**: Page reload can restore correct step! No lost state.

---

### Billing Fields → Move to `consultations`

| Old Field          | New Table                        | Why                               |
| ------------------ | -------------------------------- | --------------------------------- |
| `billed`           | `consultations.billed`           | Date session was billed (or null) |
| `insuranceClaimed` | `consultations.insuranceClaimed` | Insurance claim submitted?        |
| `cost`             | `consultations.cost`             | Session cost in cents             |

**Result**: Billing linked to actual session (not appointment).

---

### Denormalized Fields → Copied to Both Tables

| Field             | In `appointments` | In `consultations` | Why                                         |
| ----------------- | ----------------- | ------------------ | ------------------------------------------- |
| `patientId`       | ✅                | ✅                 | Efficient queries without joins             |
| `treatmentPlanId` | ✅                | ✅                 | Efficient queries for patient plan progress |
| `therapistId`     | ✅                | ✅                 | Efficient queries for therapist schedule    |

**Result**: Faster queries (no joins needed for common filters).

---

### NEW: Link Between Tables

| New Field        | Table           | Type                    | Purpose                                   |
| ---------------- | --------------- | ----------------------- | ----------------------------------------- |
| `consultationId` | `appointments`  | FK → `consultations.id` | Links appointment to its session (1:0..1) |
| `appointmentId`  | `consultations` | FK → `appointments.id`  | Links session to its appointment (1:1)    |

**Relationship**: One-to-zero-or-one

- **Appointment may have 0 consultations** (if cancelled or not started)
- **Appointment may have 1 consultation** (if session started/completed)

**Example**:

```typescript
// Cancelled appointment
{
  id: 'appt-123',
  patientId: 'patient-abc',
  date: '2026-01-27',
  status: 'cancelled',
  consultationId: null  // No session happened
}

// Confirmed appointment (session started)
{
  id: 'appt-456',
  patientId: 'patient-def',
  date: '2026-01-27',
  status: 'linked_to_consultation',
  consultationId: 'consult-789'  // Session exists!
}
```

---

## Step 4: Status Flow Changes

### OLD: Single Status Field (Mixed Concepts)

```
scheduled → confirmed → in_progress → completed
           ↓           ↓           ↓
         cancelled      cancelled   cancelled
           ↓           ↓           ↓
         no_show       no_show     no_show
```

**Problem**: "in_progress" and "completed" are session states, but "scheduled" and "cancelled" are appointment states. Same field tracks both!

---

### NEW: Separate Status Fields (Clear Concepts)

#### Appointment Status Flow (appointments.status)

```
scheduled (default when created)
    ↓ [therapist confirms]
confirmed
    ↓ [session starts]
linked_to_consultation (consultationId is set)
    ↓ [patient cancels]
cancelled (consultationId = null)
    ↓ [patient no-show]
no_show (consultationId = null)
```

**Transitions**:

- `scheduled` → `confirmed` (therapist confirms appointment)
- `scheduled`/`confirmed` → `linked_to_consultation` (session starts)
- `scheduled`/`confirmed` → `cancelled` (cancelled before session)
- `scheduled`/`confirmed` → `no_show` (patient didn't show)

---

#### Consultation Status Flow (consultations.status)

```
in_progress (created when session starts)
    ↓ [session completed]
completed
```

**Transitions**:

- `in_progress` → `completed` (therapist ends session)

**No cancellation**: Consultations don't get cancelled (appointments do).

---

### OLD vs NEW Status Mapping

| Old Status    | New Appointment Status   | New Consultation Status | When                     |
| ------------- | ------------------------ | ----------------------- | ------------------------ |
| `scheduled`   | `scheduled`              | No consultation         | Created, not confirmed   |
| `confirmed`   | `confirmed`              | No consultation         | Confirmed, not started   |
| `in_progress` | `linked_to_consultation` | `in_progress`           | Session started          |
| `completed`   | `linked_to_consultation` | `completed`             | Session finished         |
| `cancelled`   | `cancelled`              | No consultation         | Cancelled before session |
| `no_show`     | `no_show`                | No consultation         | Patient didn't show      |

---

## Step 5: NEW Field: `sessionStep` (Solves Your Problem!)

### The Problem (Current)

Therapist opens consultation page:

- URL: `/consultations/[id]?step=active-session`
- Step is stored in **URL query parameter only**
- If therapist accidentally closes tab or refreshes page
- Step is **lost** (unless they remember the exact URL)

**No database field tracks which step they're on!**

---

### The Solution (New)

Add `consultations.sessionStep` field:

```typescript
sessionStep: 'pre-session' | 'active-session' | 'post-session' | 'summary'
```

### How It Works

**Scenario 1: Starting Session**

1. Therapist opens `/consultations/[id]?step=pre-session`
2. EVA assessment, clicks "Démarrer"
3. **Database update**:
   ```sql
   UPDATE consultations
   SET sessionStep = 'active-session'
   WHERE id = 'consult-123'
   ```
4. Page navigates to `?step=active-session`

**Scenario 2: Page Reload (Recovery)**

1. Therapist accidentally closes tab during active session
2. Reopens `/consultations/[id]`
3. **Database query**:
   ```sql
   SELECT sessionStep FROM consultations WHERE id = 'consult-123'
   -- Result: 'active-session'
   ```
4. **Frontend logic**:

   ```typescript
   const stepFromQuery = route.query.step // undefined
   const stepFromDb = consultation.sessionStep // 'active-session'

   const step = stepFromQuery || stepFromDb // 'active-session'
   ```

5. Page automatically goes to `?step=active-session` ✅

**Result**: State recovery! No lost progress.

---

### When to Update `sessionStep`

| Event                                         | New sessionStep Value | Why                     |
| --------------------------------------------- | --------------------- | ----------------------- |
| Therapist clicks "Démarrer"                   | `'active-session'`    | Session started         |
| Therapist clicks "Terminer" (to post-session) | `'post-session'`      | Post-session assessment |
| Therapist clicks "Confirmer et Continuer"     | `'summary'`           | Session complete        |
| Therapist manually navigates to step          | Current step          | Save manual navigation  |

---

### Step Flow with `sessionStep`

```
┌─────────────────┐
│  pre-session   │  ← URL: /consultations/[id]?step=pre-session
│  EVA input     │     DB: sessionStep = 'pre-session'
└────────┬────────┘
         │ Click "Démarrer"
         ↓
┌─────────────────┐
│ active-session  │  ← URL: /consultations/[id]?step=active-session
│  Notes, timer  │     DB: sessionStep = 'active-session'
└────────┬────────┘
         │ Click "Terminer"
         ↓
┌─────────────────┐
│  post-session  │  ← URL: /consultations/[id]?step=post-session
│  Final EVA     │     DB: sessionStep = 'post-session'
└────────┬────────┘
         │ Click "Confirmer et Continuer"
         ↓
┌─────────────────┐
│    summary     │  ← URL: /consultations/[id]?step=summary
│  Analytics     │     DB: sessionStep = 'summary'
└─────────────────┘
```

**Recovery**: If page reloads at any step, database `sessionStep` restores correct view.

---

## Step 6: Visual Examples

### Example 1: Booked Appointment (No Session Yet)

**appointments table**:

```sql
{
  id: 'appt-001',
  patientId: 'patient-001',
  therapistId: 'therapist-001',
  date: '2026-01-28',
  startTime: '14:00',
  endTime: '15:00',
  duration: 60,
  type: 'follow_up',
  location: 'clinic',
  status: 'confirmed',
  confirmedAt: 1706408400000,  // 2026-01-27 11:00:00
  consultationId: NULL,           // No session yet!
  createdAt: 1706404800000,
  updatedAt: 1706408400000
}
```

**consultations table**:

```sql
-- No row! Session hasn't started yet.
```

---

### Example 2: Active Session (In Progress)

**appointments table**:

```sql
{
  id: 'appt-002',
  patientId: 'patient-001',
  therapistId: 'therapist-001',
  date: '2026-01-27',
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  type: 'initial',
  location: 'clinic',
  status: 'linked_to_consultation',  -- Session started!
  consultationId: 'consult-001',      -- Links to session
  createdAt: 1706318400000,
  updatedAt: 1706318400000
}
```

**consultations table**:

```sql
{
  id: 'consult-001',
  appointmentId: 'appt-002',           -- Links to appointment
  patientId: 'patient-001',
  therapistId: 'therapist-001',
  chiefComplaint: 'Lower back pain',
  notes: 'Applied manual therapy...',
  painLevelBefore: 7,
  painLevelAfter: NULL,                 -- Not yet (session active)
  sessionStep: 'active-session',        -- NEW! Current step
  status: 'in_progress',
  actualStartTime: '10:03:45',
  actualDurationSeconds: 1200,         -- 20 minutes so far
  pauseStartTime: NULL,                 -- Not paused
  createdAt: 1706318400000,
  updatedAt: 1706319600000
}
```

**Key observations**:

- Appointment exists (scheduled yesterday)
- Consultation created when session started
- `appointments.consultationId` links to `consultations.id`
- `consultations.sessionStep` = `'active-session'` (currently in session)
- Page reload will restore to `active-session` step ✅

---

### Example 3: Completed Session

**appointments table**:

```sql
{
  id: 'appt-003',
  patientId: 'patient-002',
  therapistId: 'therapist-001',
  date: '2026-01-26',
  startTime: '09:00',
  endTime: '10:00',
  duration: 60,
  status: 'linked_to_consultation',
  consultationId: 'consult-002',
  createdAt: 1706232000000,
  updatedAt: 1706232000000
}
```

**consultations table**:

```sql
{
  id: 'consult-002',
  appointmentId: 'appt-003',
  patientId: 'patient-002',
  notes: 'Session went well, patient reported...',
  treatmentSummary: 'Released lumbar tension',
  painLevelBefore: 8,
  painLevelAfter: 5,                    -- Improved by 3 points!
  sessionStep: 'summary',                -- Session complete
  status: 'completed',
  actualStartTime: '09:02:15',
  actualDurationSeconds: 3300,           -- 55 minutes actual
  totalPausedSeconds: 300,               -- 5 minutes paused
  pauseStartTime: NULL,
  tags: '["Douleur Diminuée", "Proprioception"]',
  billed: '2026-01-26',
  cost: 5000,                          // €50.00
  createdAt: 1706232000000,
  updatedAt: 1706235600000
}
```

**Key observations**:

- Appointment and consultation both exist
- `sessionStep` = `'summary'` (session done)
- `status` = `'completed'` (session finished)
- All clinical data populated
- Billing info recorded

---

### Example 4: Cancelled Appointment (Never Happened)

**appointments table**:

```sql
{
  id: 'appt-004',
  patientId: 'patient-003',
  therapistId: 'therapist-002',
  date: '2026-01-29',
  startTime: '15:00',
  endTime: '16:00',
  status: 'cancelled',                  -- Cancelled!
  cancelledAt: 1706577600000,         -- Cancelled on 2026-01-28
  consultationId: NULL,                 -- No session created!
  createdAt: 1706491200000,
  updatedAt: 1706577600000
}
```

**consultations table**:

```sql
-- No row! Appointment cancelled, no session ever happened.
```

**Key observations**:

- Only appointment row exists
- No consultation row (session never happened)
- No wasted space (no null clinical fields)
- Clean separation!

---

## Step 7: Query Examples

### OLD Query (Before Change)

```typescript
// Get therapist's schedule for today
const schedule = await db
  .select()
  .from(consultations)
  .where(and(eq(consultations.therapistId, therapistId), eq(consultations.date, '2026-01-27')))
  .orderBy(consultations.startTime)
```

**Result**: Returns ALL fields (scheduling + clinical) even if session hasn't started (lots of NULLs).

---

### NEW Query: Appointments Only

```typescript
// Get therapist's schedule for today
const schedule = await db
  .select({
    // Only appointment fields
    id: appointments.id,
    patientId: appointments.patientId,
    date: appointments.date,
    startTime: appointments.startTime,
    status: appointments.status,
    // Add consultation status if exists
    consultationStatus: consultations.status,
    sessionStep: consultations.sessionStep
  })
  .from(appointments)
  .leftJoin(consultations, eq(appointments.consultationId, consultations.id))
  .where(and(eq(appointments.therapistId, therapistId), eq(appointments.date, '2026-01-27')))
  .orderBy(appointments.startTime)
```

**Result**: Returns smaller rows (only needed fields), faster queries.

---

### NEW Query: Patient's Session History

```typescript
// Get all completed sessions for a patient
const history = await db
  .select({
    // From consultations (clinical data)
    painLevelBefore: consultations.painLevelBefore,
    painLevelAfter: consultations.painLevelAfter,
    notes: consultations.notes,
    treatmentSummary: consultations.treatmentSummary,
    // From appointments (scheduling context)
    date: appointments.date,
    type: appointments.type
  })
  .from(consultations)
  .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
  .where(and(eq(consultations.patientId, patientId), eq(consultations.status, 'completed')))
  .orderBy(appointments.date)
```

**Result**: Only clinical data + minimal scheduling context. Efficient!

---

### NEW Query: Check Session Step (Recovery)

```typescript
// Get current session step for page reload
const [session] = await db
  .select({
    sessionStep: consultations.sessionStep,
    status: consultations.status
  })
  .from(consultations)
  .where(eq(consultations.id, consultationId))

// Use for recovery
const step = session.sessionStep || 'pre-session'
```

**Result**: Instant recovery of step after page reload! ✅

---

## Step 8: Migration Process (Development)

Since you're in development, here's the simple approach:

### 1. Drop Old Table

```sql
DROP TABLE IF EXISTS consultations;
```

### 2. Create New Tables

Run CREATE TABLE statements for both `appointments` and `consultations` (from schema files).

### 3. Re-run Seed Script

```bash
npm run seed
```

This will:

- Create appointments with scheduled/confirmed status
- Create consultations for in_progress/completed sessions
- Link appointments to consultations properly

### 4. Verify Migration

```sql
-- Check appointments count
SELECT COUNT(*) FROM appointments;

-- Check consultations count
SELECT COUNT(*) FROM consultations;

-- Verify linked appointments
SELECT COUNT(*) FROM appointments
WHERE status = 'linked_to_consultation'
AND consultationId IS NOT NULL;

-- Verify cancelled have no consultation
SELECT COUNT(*) FROM appointments
WHERE status IN ('cancelled', 'no_show')
AND consultationId IS NOT NULL;  -- Should be 0
```

---

## Summary of Changes

| Aspect                 | Before                        | After                            | Benefit                      |
| ---------------------- | ----------------------------- | -------------------------------- | ---------------------------- |
| **Tables**             | 1 (consultations)             | 2 (appointments + consultations) | Clear separation             |
| **Appointment fields** | Mixed with clinical           | Dedicated table                  | Scheduling queries efficient |
| **Clinical fields**    | Mixed with scheduling         | Dedicated table                  | Session queries efficient    |
| **Status tracking**    | Single mixed field            | Two separate fields              | Clear lifecycles             |
| **Session step**       | URL only                      | Database field ✅                | Recovery after reload!       |
| **Null fields**        | Many (cancelled appointments) | Few (only where needed)          | Data integrity               |
| **Row size**           | Large (23 fields)             | Medium (16) + Medium (23)        | Better performance           |

---

## Key Takeaways

1. **appointments** = Scheduling (booking, time slots, cancellations)
2. **consultations** = Clinical sessions (treatment, notes, outcomes)
3. **Link**: `appointments.consultationId` → `consultations.appointmentId`
4. **NEW**: `consultations.sessionStep` solves your reload problem
5. **Status**: Separate for appointments (scheduling) and consultations (clinical)
6. **Benefit**: Cleaner architecture, better performance, state recovery

---

## Questions?

1. Does this explanation make the new structure clear?
2. Do you understand how `sessionStep` solves the reload issue?
3. Ready for me to implement the schema changes?
