# add-rooms-management Design

## Architecture Overview

This design introduces a new rooms entity following the existing multi-tenant patterns used for patients, consultations, and other organization-scoped data. The implementation spans three layers:

1. **Database Layer**: New `rooms` table with proper indexing
2. **API Layer**: RESTful endpoints with Zod validation
3. **Client Layer**: Composable for data fetching and UI integration

## Data Model

### Rooms Table Schema

```typescript
rooms {
  id: text (UUID) - Primary key
  organizationId: text (FK to organizations)
  name: text - Room display name
  description: text (optional) - Usage notes
  equipment: text[] (JSON array) - Equipment inventory
  capacity: integer - Maximum patient capacity
  area: integer - Surface area in square meters
  prm: integer (boolean) - Accessibility flag
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp (optional) - Soft-delete
}
```

### Indexing Strategy

Following the existing patterns for organization-scoped data:

```typescript
// Primary query: List all rooms for organization
index('idx_rooms_org_name').on(organizationId, deletedAt, name)

// Date-based filtering (newest first)
index('idx_rooms_org_created').on(organizationId, deletedAt, createdAt)

// Find deleted rooms (trash view)
index('idx_rooms_org_deleted').on(organizationId, deletedAt)
```

### Foreign Key Relationships

```typescript
rooms.organizationId -> organizations.id (CASCADE DELETE)
```

**Rationale**: Cascade delete ensures that if an organization is deleted, all its rooms are also deleted. This aligns with the multi-tenant data isolation model.

## API Design

### Endpoints

#### GET /api/rooms

List all rooms for the active organization with optional search filtering.

**Query Parameters**:

- `search` (optional) - Search in name and description

**Response**: Array of rooms

```typescript
Room[]
```

#### POST /api/rooms

Create a new room.

**Request Body**: RoomCreate schema

**Response**: Created room object

**Validation**:

- `name`: Required, min 2 characters
- `description`: Optional, max 500 characters
- `equipment`: Optional, array of strings
- `capacity`: Required, min 1
- `area`: Optional, min 1
- `prm`: Required, boolean

#### PUT /api/rooms/[id]

Update an existing room.

**Request Body**: RoomUpdate schema (all fields optional)

**Response**: Updated room object

**Constraints**:

- Must belong to active organization
- Room must not be soft-deleted

#### DELETE /api/rooms/[id]

Soft-delete a room.

**Response**: Success message

**Future Constraint** (when room-based scheduling is added):

- Prevent deletion if room has existing bookings/consultations

### Validation Strategy

Using Zod schemas following the patient management pattern:

```typescript
// Base validation schemas
export const roomNameSchema = z.string().min(2).max(100)
export const roomDescriptionSchema = z.string().max(500).optional()

// Create schema
export const roomCreateSchema = createInsertSchema(rooms, {
  name: roomNameSchema,
  description: roomDescriptionSchema,
  capacity: z.coerce.number().min(1).max(50),
  area: z.coerce.number().min(1).max(1000).optional(),
  prm: z.coerce.boolean()
})

// Update schema (all fields optional)
export const roomUpdateSchema = roomCreateSchema.partial()
```

**French Locale**: All validation messages will use French locale (`z.config(fr)`) to match existing schemas.

## Client Architecture

### Composable Pattern

Following the existing composables (`usePatient`, `useOrganization`, etc.):

```typescript
export const useRooms = createSharedComposable(() => {
  const rooms = ref<Room[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Fetch rooms with optional search
  async function fetchRooms(options?: RoomQuery) {
    loading.value = true
    try {
      rooms.value = await $fetch('/api/rooms', {
        query: options
      })
      return rooms.value
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create room
  async function createRoom(data: RoomCreate) {
    return await $fetch('/api/rooms', {
      method: 'POST',
      body: data
    })
  }

  // Update room
  async function updateRoom(id: string, data: RoomUpdate) {
    return await $fetch(`/api/rooms/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  // Delete room
  async function deleteRoom(id: string) {
    return await $fetch(`/api/rooms/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom
  }
})
```

### UI Integration

Existing components will be updated to use the new composable:

1. **OrganizationRoomSlideover.vue**
   - Replace console.log with real API call
   - Use `createRoom` from composable
   - Handle loading states and errors

2. **OrganizationProfileRoomsTab.vue**
   - Replace mock data with `fetchRooms` result
   - Connect edit/duplicate/delete buttons to composable methods
   - Implement proper error handling and toast notifications

## Database Migration Strategy

### Migration File Structure

```sql
-- 0001_add_rooms_table.sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  equipment TEXT DEFAULT '[]',
  capacity INTEGER NOT NULL DEFAULT 1,
  area INTEGER,
  prm INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  deletedAt INTEGER,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_rooms_org_name ON rooms(organizationId, deletedAt, name);
CREATE INDEX idx_rooms_org_created ON rooms(organizationId, deletedAt, createdAt);
CREATE INDEX idx_rooms_org_deleted ON rooms(organizationId, deletedAt);
```

## Security Considerations

### Organization Isolation

All room operations must enforce organization scoping:

```typescript
const { organizationId } = await requireAuth(event)
  // All queries include organizationId filter
  .where(eq(rooms.organizationId, organizationId), isNull(rooms.deletedAt))
```

### Authorization

- All endpoints require authentication via `requireAuth(event)`
- Read/write operations require organization membership
- Cross-organization access prevented by organizationId filter

### Data Validation

- Zod schemas validate all input data
- French locale for user-facing error messages
- SQL injection prevention via parameterized queries (Drizzle ORM)

## Error Handling

Consistent with existing API patterns:

```typescript
try {
  // Operation
} catch (error) {
  handleApiError(error) // Standardized error response
}
```

Standardized error responses:

- **400**: Validation error (invalid input)
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (not organization member)
- **404**: Not found (room doesn't exist or wrong organization)
- **500**: Server error

## Future Extensibility

### Room-Based Scheduling

When implementing consultation room assignment:

1. Add `roomId` column to `consultations` table
2. Add foreign key: `consultations.roomId -> rooms.id`
3. Update deletion constraint to check for active bookings
4. Implement availability queries for scheduling UI

### Advanced Features (Out of Scope)

- Room status management (available, occupied, maintenance)
- Real-time availability tracking
- Room analytics and utilization reports
- Equipment inventory management
- Multi-room scheduling conflicts

## Performance Considerations

1. **No pagination needed**: Organizations typically have a small number of rooms (5-20), so returning all rooms without pagination is efficient
2. **Indexing**: Proper indexes on organizationId and commonly filtered fields
3. **Soft-delete**: Index includes deletedAt for efficient filtering of active records
4. **JSON storage**: Equipment stored as JSON array for flexibility without join overhead

## Testing Strategy

### Manual Testing (Current)

- Test all CRUD operations via API
- Test UI form submission and display
- Test organization isolation (create room in org A, verify not visible in org B)
- Test validation error messages
- Test deletion behavior

### Future Automated Testing

When test framework is added:

- Unit tests for API endpoints
- Integration tests for database operations
- E2E tests for UI workflows

## Compliance and Standards

- **Data Retention**: Soft-delete aligns with medical data retention requirements
- **Audit Trail**: Timestamps track all modifications
- **Multi-tenancy**: Strict organization isolation meets SaaS data protection standards
- **French Locale**: All user-facing messages in French for regional compliance
