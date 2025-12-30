# Room-Centric Booking System - Technical Design

## Architecture Overview

The room-centric booking system replaces therapist-centric availability calculations with a simpler model where physical rooms serve as the natural concurrency constraint. This design eliminates the need for `maxSessions` logic by leveraging the physical reality that one room can host only one session at a time.

### Core Principles

1. **Physical Constraint Modeling:** Database unique constraint enforces one session per room at any given time
2. **Binary Availability:** Rooms are either booked or free - no capacity counting needed
3. **On-Demand Calculation:** Slots calculated per room when user requests, not pre-calculated
4. **Progressive Disclosure:** Room cards → Duration → Slots → Book (natural mental model)

## Database Schema Changes

### New Field: consultations.roomId

```typescript
// server/database/schema/consultation.ts
roomId: text().references(() => rooms.id), // NEW: Room this session is in
```

**Rationale:**

- Links each consultation to a specific room
- Enables room-based slot generation
- Allows for room utilization analytics
- Nullable to support historical data (existing consultations without room assignment)

**Migration Strategy:**

- Add nullable `roomId` column to existing consultations table
- All existing consultations have `roomId = NULL`
- New bookings require `roomId` (validation at API level)

### Unique Constraint: Prevent Double-Booking

```typescript
// server/database/schema/consultation.ts
index('idx_consultations_room_booking_unique').on(table.roomId, table.date, table.startTime)
```

**Rationale:**

- Database-level guarantee against double-booking same room at same time
- Works across all therapists (any therapist can't book same room)
- Simplifies application logic (no need for app-level conflict detection)
- Provides clear error message when constraint violated

**Constraint Semantics:**

- `roomId + date + startTime` must be unique across all consultations
- Even if `endTime` differs, two sessions can't start at same time in same room
- Applies to all statuses except 'cancelled' (cancelled sessions don't block slots)

## API Architecture

### Endpoint 1: Room-Based Availability

**Route:** `POST /api/availability/[roomId]/slots`

**Request Body:**

```typescript
{
  dates: string[],           // Array of date strings (YYYY-MM-DD)
  duration: number,          // Session duration in minutes
  therapistId?: string       // Optional: filter by therapist
}
```

**Response:**

```typescript
{
  slots: {
    "2025-01-15": {
      availableSlots: string[],  // ["09:00", "09:15", "09:30"]
      unavailable: boolean        // false
    }
  }
}
```

**Algorithm:**

1. **Fetch Room Details:**
   - Get room metadata (equipment, capacity)
   - Verify room exists and belongs to user's organization

2. **Fetch Therapist Availability:**
   - Get weekly templates for the room's location (clinic)
   - Get availability exceptions for requested dates
   - Merge to get effective availability per date

3. **Fetch Existing Bookings:**
   - Query consultations where `roomId = [roomId]`
   - Filter by requested dates
   - Exclude cancelled sessions
   - Map to booked periods: `[{ start: "09:00", end: "09:45", sessionId: "..." }]`

4. **Calculate Available Ranges:**
   - Start with effective availability ranges (e.g., 09:00-17:00)
   - Subtract booked periods with gap buffer:
     - Session ends 09:40 + 15min gap = 09:55
     - Next available slot aligns to next increment (10:00)

5. **Generate Slots:**
   - For each available range, generate time slots at `slotIncrementMinutes` intervals
   - Filter slots where `slotTime + duration <= rangeEnd`
   - Return list of available start times

**Comparison with Therapist-Centric (Current):**

| Aspect           | Therapist-Centric (Current)             | Room-Centric (New)                 |
| ---------------- | --------------------------------------- | ---------------------------------- |
| Primary Key      | therapistId                             | roomId                             |
| Capacity Check   | Count concurrent sessions < maxSessions | Simple: is room booked?            |
| Query Complexity | High (counting, concurrency math)       | Low (simple boolean check)         |
| DB Constraint    | None                                    | UNIQUE(roomId, date, startTime)    |
| Slot Generation  | Complex (maxSessions logic)             | Simple (booked period subtraction) |

### Endpoint 2: Create Consultation with Room

**Route:** `POST /api/consultations` (modified)

**Request Body:**

```typescript
{
  ...existing fields,
  roomId: string  // NEW: Room for this consultation
}
```

**Validation:**

```typescript
const consultationCreateSchema = z.object({
  // ...existing fields
  roomId: z.string().uuid() // Required for new bookings
})
```

**Error Handling:**

- **Duplicate Booking Error (409):**

  ```json
  {
    "error": "This slot is already booked. Please select another time."
  }
  ```

  - Triggered by unique constraint violation
  - DB error caught and translated to user-friendly message

- **Room Not Found (404):**

  ```json
  {
    "error": "Room not found"
  }
  ```

- **Historical Consultation (400):**
  ```json
  {
    "error": "roomId is required for new consultations"
  }
  ```

**Business Logic:**

1. Validate `roomId` exists and belongs to user's organization
2. Attempt to insert consultation
3. If unique constraint violated, catch and return 409 error
4. If successful, return created consultation object

## Component Architecture

### Component 1: Room Cards (Overview)

**File:** `app/components/booking/RoomCards.vue`

**Props:**

```typescript
interface Props {
  date?: string // Optional date for filtering
  roomId?: string // Optional pre-selected room
}
```

**State:**

```typescript
const { data: rooms, loading, error } = useRooms()
const selectedRoom = ref<Room | null>(null)
const showDurationSelector = ref(false)
```

**UI Layout:**

```
┌─────────────────────────────┐
│  ROOM 1 - Treatment Room   │
│  5 slots available         │
│  Next: 9:00 • Last: 16:00│
│  [ VIEW SLOTS ]          │
└─────────────────────────────┘
┌─────────────────────────────┐
│  ROOM 2 - Exercise Room   │
│  8 slots available         │
│  Next: 9:15 • Last: 16:45│
│  [ VIEW SLOTS ]          │
└─────────────────────────────┘
```

**Data Flow:**

1. Fetch rooms list on mount
2. For each room, fetch slot count and next/last availability
   - Lightweight query: `GET /api/rooms/[id]/quick-availability?date=...`
   - Returns: `{ slotsToday: 5, nextSlot: "09:00", lastSlot: "16:00" }`
3. Display room card with preview data
4. On tap → open duration selector

**Performance Optimization:**

- Batch fetch quick availability for all rooms in single request
- Cache preview data for 1-2 minutes (optional)
- Use optimistic updates for slot counts

### Component 2: Duration Selector

**File:** `app/components/booking/DurationSelector.vue`

**Props:**

```typescript
interface Props {
  room: Room // Selected room
  consultation?: Consultation // Optional: editing existing consultation
}
```

**State:**

```typescript
const selectedDuration = ref(45) // Default 45 min
const showSlotGrid = ref(false)
```

**UI Layout:**

```
Select Session Duration
┌─────────────────────────────┐
│ ○ 15 minutes              │
│ ● 45 minutes (selected)   │
│ ○ 60 minutes              │
│ ...                       │
└─────────────────────────────┘

[ SHOW SLOTS ]
```

**Data Flow:**

1. Display 8 duration options from `CONSULTATION_DURATIONS` constant
2. User selects duration → update `selectedDuration`
3. User taps "Show Slots" → open slot grid with selected duration

**Validation:**

- Ensure room exists
- Ensure therapist has availability for selected duration (if therapistId provided)

### Component 3: Slot Grid

**File:** `app/components/booking/SlotGrid.vue`

**Props:**

```typescript
interface Props {
  room: Room
  date: string
  duration: number
  therapistId?: string
}
```

**State:**

```typescript
const {
  data: slots,
  loading,
  error
} = useRoomSlots(
  () => props.room.id,
  () => props.date,
  () => props.duration,
  () => props.therapistId
)
const selectedSlot = ref<string | null>(null)
const isBooking = ref(false)
```

**UI Layout:**

```
Room 1 - 45 min sessions
Morning
┌──────┬──────┬──────┬──────┐
│ 9:00 │ 9:15 │ 9:30 │ 9:45│
│  ✓   │  ✓   │  ✗   │  ✓  │
└──────┴──────┴──────┴──────┘

Afternoon
┌──────┬──────┬──────┬──────┐
│13:00 │13:15 │13:30 │13:45│
│  ✓   │  ✓   │  ✓   │  ✗  │
└──────┴──────┴──────┴──────┘
```

**Data Flow:**

1. On mount, call `POST /api/availability/[roomId]/slots`
2. Display available slots grouped by Morning/Afternoon
3. User taps slot → update `selectedSlot`
4. User confirms → call booking API

**Mobile Optimizations:**

- Horizontal scrolling time blocks
- Touch targets 44px+ (Apple HIG minimum)
- Time groupings: Morning (before 12:00), Afternoon (12:00+)
- Visual indicators: ✓ green (available), ✗ gray (booked)

**Error Handling:**

- Show loading skeleton while fetching slots
- Display error toast if API fails
- Allow retry
- Show "no slots available" message if empty

### Component 4: Booking Confirmation

**File:** `app/components/booking/BookingConfirmation.vue`

**Props:**

```typescript
interface Props {
  room: Room
  date: string
  time: string
  duration: number
  patient: Patient
  therapist?: User
}
```

**State:**

```typescript
const isBooking = ref(false)
const showSuccess = ref(false)
const error = ref<string | null>(null)
```

**UI Layout:**

```
✅ Session Booked!

Room: Treatment Room
Patient: Jean Dupont
Date: 15 Jan 2025
Time: 09:00 - 09:45
Therapist: Dr. Martin

[ OK ]  [ Edit Booking ]
```

**Data Flow:**

1. Display booking summary
2. Show loading state while creating consultation
3. On success → show confirmation with edit option
4. On error → show error message, allow retry

**Booking Logic:**

```typescript
const createConsultationMutation = useCreateConsultation()

await createConsultationMutation.mutateAsync({
  patientId: props.patient.id,
  consultationData: {
    roomId: props.room.id,
    date: props.date,
    startTime: props.time,
    endTime: calculateEndTime(props.time, props.duration),
    duration: props.duration,
    therapistId: props.therapist?.id
    // ... other fields
  }
})
```

## Data Flow Diagram

```
User taps room card
       ↓
DurationSelector opens
       ↓
User selects 45 min
       ↓
SlotGrid opens
       ↓
POST /api/availability/[roomId]/slots
       ↓
Slots returned → displayed
       ↓
User taps 09:00
       ↓
BookingConfirmation shows summary
       ↓
User confirms
       ↓
POST /api/consultations
       ↓
DB unique constraint check
       ├─ Success → Confirmation screen
       └─ Failed (409) → Error: "This slot is already booked"
```

## Performance Considerations

### Database Indexes

**Existing Indexes (Adequate):**

```typescript
// By room and date
index('idx_consultations_org_patient_date').on(table.organizationId, table.patientId, table.date)

// By date range
index('idx_consultations_org_date').on(table.organizationId, table.date)
```

**New Indexes (Recommended):**

```typescript
// Room-based queries
index('idx_consultations_room_date').on(table.roomId, table.date)

// Room-based booking check
index('idx_consultations_room_date_time').on(table.roomId, table.date, table.startTime)
```

### Query Optimization

**Room Availability Query:**

```sql
SELECT date, startTime, endTime
FROM consultations
WHERE roomId = ?
  AND date IN (?, ?, ?)  -- Up to 7 days
  AND status != 'cancelled'
```

**Estimated Performance:**

- Single room, 7 days: <10ms
- All rooms (4-6), 7 days: <50ms
- Cloudflare D1: Sub-100ms for typical queries

### Caching Strategy

**Client-Side (Recommended):**

- Cache room list: 5 minutes
- Cache slot availability: 1 minute (stale-while-revalidate)
- Invalidate on successful booking

**Server-Side (Optional):**

- None needed for current scale
- Could add Redis cache for slot calculations if needed

## Security Considerations

### Access Control

**Room Access:**

- Users can only book rooms in their organization
- `organizationId` check enforced in API layer
- Room list endpoint filters by user's organization

**Cross-Therapist Booking:**

- Any therapist in organization can book any room
- No additional restrictions needed
- Unique constraint prevents conflicts

**Data Privacy:**

- Consultation data access controlled by existing auth rules
- Room assignments visible to organization members
- No PII stored in rooms table

### Input Validation

**roomId Validation:**

```typescript
z.string()
  .uuid()
  .refine(async (roomId) => {
    const room = await getRoomById(roomId)
    return room?.organizationId === userOrganizationId
  }, 'Room not found')
```

**Date/Time Validation:**

```typescript
z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // Date format
z.string().regex(/^\d{2}:\d{2}$/) // Time format
z.number().min(15).max(120) // Duration
```

## Error Handling Strategy

### Database Errors

| Error Type        | DB Error                 | HTTP Status     | User Message                                               |
| ----------------- | ------------------------ | --------------- | ---------------------------------------------------------- |
| Duplicate Booking | UNIQUE constraint failed | 409 Conflict    | "This slot is already booked. Please select another time." |
| Room Not Found    | No record found          | 404 Not Found   | "Room not found"                                           |
| Invalid roomId    | Foreign key violation    | 400 Bad Request | "Invalid room selection"                                   |

### API Errors

| Scenario              | HTTP Status             | User Message                                | Recovery                         |
| --------------------- | ----------------------- | ------------------------------------------- | -------------------------------- |
| No available slots    | 200 (empty array)       | "No slots available for this date"          | User selects different date      |
| Therapist unavailable | 200 (empty array)       | "Therapist not available for this duration" | User selects different therapist |
| Network error         | 503 Service Unavailable | "Connection error. Please try again."       | Retry button                     |
| Validation error      | 400 Bad Request         | Field-specific French messages              | User corrects input              |

## Testing Strategy

### Unit Tests

**Slot Generation Algorithm:**

```typescript
describe('generateRoomSlots', () => {
  it('generates slots for single availability range', () => {
    const slots = generateRoomSlots([{ start: '09:00', end: '17:00' }], [], 45, 15)
    expect(slots).toContain('09:00')
    expect(slots).toContain('09:15')
    // ...
  })

  it('respects gap buffer', () => {
    const slots = generateRoomSlots(
      [{ start: '09:00', end: '17:00' }],
      [{ start: '09:00', end: '09:45' }], // Booked session
      45,
      15
    )
    expect(slots).not.toContain('09:00')
    expect(slots).toContain('10:00') // 09:45 + 15min gap
  })
})
```

### Integration Tests

**Room Booking Flow:**

```typescript
describe('Room Booking API', () => {
  it('prevents double-booking same room', async () => {
    const booking1 = await createConsultation({
      roomId,
      date: '2025-01-15',
      startTime: '09:00'
    })
    expect(booking1).toBeDefined()

    await expect(
      createConsultation({
        roomId,
        date: '2025-01-15',
        startTime: '09:00'
      })
    ).rejects.toThrow('UNIQUE constraint')
  })
})
```

### Manual Testing

**Test Cases:**

1. Book room slot successfully
2. Attempt double-booking (should fail)
3. Book multiple rooms simultaneously
4. Book same room at different times
5. Handle equipment breakdown scenario
6. Mobile UI responsiveness

## Migration Plan

### Phase 1: Database Migration

**Step 1:** Add `roomId` column (nullable)

```sql
ALTER TABLE consultations
ADD COLUMN roomId TEXT REFERENCES rooms(id);
```

**Step 2:** Create unique constraint

```sql
CREATE UNIQUE INDEX idx_consultations_room_booking_unique
ON consultations (roomId, date, startTime);
```

**Step 3:** Existing data preserved (NULL roomId)

### Phase 2: API Migration

**Step 1:** Create new room-based endpoint

- Keep existing therapist-centric endpoint active
- Run both endpoints in parallel

**Step 2:** Update consultation creation API

- Accept optional `roomId`
- Validate `roomId` when provided

**Step 3:** Update types and validation schemas

- Add `roomId` to `ConsultationCreate` type

### Phase 3: UI Migration

**Step 1:** Create new room-based components

- RoomCards, DurationSelector, SlotGrid, BookingConfirmation
- Keep existing manual planning component available

**Step 2:** Gradual rollout

- Feature flag to switch between old/new UI
- Test with small group of therapists
- Monitor for issues

**Step 3:** Full migration

- Disable therapist-centric endpoint
- Remove old UI components
- Require `roomId` for all new bookings

## Rollback Plan

If issues arise after deployment:

1. **Immediate:** Re-enable therapist-centric endpoint
2. **Short-term:** Add feature flag to switch UI back
3. **Long-term:** Drop `roomId` column (historical data preserved)

No data loss expected - historical consultations preserved with NULL roomId.

## Future Enhancements

Out of scope for current implementation, documented for future:

1. **Room Utilization Analytics:**
   - Track room usage patterns
   - Identify underutilized rooms
   - Optimize room scheduling

2. **Predictive Room Recommendations:**
   - AI suggests best room based on patient condition
   - Equipment matching algorithm
   - Historical pattern analysis

3. **Room Templates:**
   - Clone rooms for multi-clinic scenarios
   - Standardized room configurations
   - Bulk room creation

4. **Automatic Cancellation Windows:**
   - Configurable cancellation deadlines
   - Automatic refund processing
   - Waitlist management

5. **Equipment Maintenance Tracking:**
   - Schedule equipment maintenance
   - Block rooms during maintenance
   - Notify affected patients
