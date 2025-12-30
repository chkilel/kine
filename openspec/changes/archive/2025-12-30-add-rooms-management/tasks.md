# add-rooms-management Tasks

## Task 1: Create database schema for rooms table

Create `server/database/schema/rooms.ts` with the rooms table definition including all fields (id, organizationId, name, description, equipment, capacity, area, prm, timestamps), proper foreign key relationships to organizations table, and indexes for efficient queries.

**Success criteria**:

- Schema file created with proper Drizzle table definition
- Foreign key to organizations.id with cascade delete
- Indexes created: idx_rooms_org_name, idx_rooms_org_created, idx_rooms_org_deleted
- Equipment field uses text mode 'json' for JSON array storage
- All timestamp fields use integer mode 'timestamp_ms'
- Schema exported from index file

**Dependencies**: None
**Priority**: High

- [x] Completed

---

## Task 2: Create Zod validation schemas for rooms

Create `shared/types/room.types.ts` with RoomCreate, RoomUpdate, Room, and RoomQuery schemas using drizzle-zod helpers, including French locale configuration and field validation rules.

**Success criteria**:

- roomNameSchema with min(2) and max(100) characters
- roomDescriptionSchema with max(500) characters, optional
- roomCreateSchema using createInsertSchema with custom validations
- roomUpdateSchema as partial version of create schema
- roomQuerySchema with search parameter only
- All schemas configured with French locale
- TypeScript types exported (Room, RoomCreate, RoomUpdate, RoomQuery)

**Dependencies**: Task 1 (schema must exist first)
**Priority**: High

- [x] Completed

---

## Task 3: Generate and run database migration

Create migration file for rooms table using Drizzle, generate the SQL, and apply the migration to the development database.

**Success criteria**:

- Migration file generated in server/database/migrations/
- SQL includes CREATE TABLE statement with all columns
- SQL includes CREATE INDEX statements
- Foreign key constraints properly defined
- Migration applied successfully to development database
- Tables created and verified using database tools

**Dependencies**: Task 1
**Priority**: High

- [x] Completed

---

## Task 4: Implement GET /api/rooms endpoint

Create `server/api/rooms/index.get.ts` to list all rooms with optional search functionality, following the pattern from patients API but without pagination.

**Success criteria**:

- Endpoint requires authentication via requireAuth
- Validates organizationId from session
- Supports query parameter: search (optional)
- Filters by organizationId and excludes soft-deleted records (isNull(deletedAt))
- Implements LIKE search on name and description fields when search parameter is provided
- Returns array of all rooms (no pagination)
- Uses proper indexes for efficient queries
- Error handling with handleApiError

**Dependencies**: Task 1, Task 2
**Priority**: High

- [x] Completed

---

## Task 5: Implement POST /api/rooms endpoint

Create `server/api/rooms/index.post.ts` to create new rooms, following the pattern from patients API.

**Success criteria**:

- Endpoint validates request body with roomCreateSchema
- Requires authentication via requireAuth
- Automatically sets organizationId from session
- Inserts room record using Drizzle
- Returns created room object with all fields
- Returns 200 status on success
- Validates required fields (name, capacity)
- Validates field constraints (min/max lengths, ranges)
- Error handling with handleApiError

**Dependencies**: Task 1, Task 2, Task 3
**Priority**: High

- [x] Completed

---

## Task 6: Implement PUT /api/rooms/[id] endpoint

Create `server/api/rooms/[id]/index.put.ts` to update existing rooms, following the pattern from patients API.

**Success criteria**:

- Validates room ID parameter
- Validates request body with roomUpdateSchema
- Requires authentication via requireAuth
- Filters by organizationId, roomId, and isNull(deletedAt)
- Updates room record using Drizzle update
- Returns updated room object
- Returns 404 if room not found or belongs to different organization
- All fields are optional in request body
- Error handling with handleApiError

**Dependencies**: Task 1, Task 2, Task 4
**Priority**: High

- [x] Completed

---

## Task 7: Implement DELETE /api/rooms/[id] endpoint

Create `server/api/rooms/[id]/index.delete.ts` to soft-delete rooms, following the pattern from patients API.

**Success criteria**:

- Validates room ID parameter
- Requires authentication via requireAuth
- Filters by organizationId, roomId, and isNull(deletedAt)
- Performs soft-delete by setting deletedAt timestamp
- Also updates updatedAt timestamp
- Returns success message on deletion
- Returns 404 if room not found or belongs to different organization
- Prevents double-deletion of already deleted rooms
- Error handling with handleApiError

**Dependencies**: Task 1, Task 4
**Priority**: High

- [x] Completed

---

## Task 8: Create useRooms composable

Create `app/composables/useRooms.ts` with reactive state and methods for room CRUD operations, following the pattern from usePatient.

**Success criteria**:

- Uses createSharedComposable for reactivity
- Exposes reactive refs: rooms, loading, error
- Implements fetchRooms(query?) method with optional search parameter
- Implements createRoom(data) method
- Implements updateRoom(id, data) method
- Implements deleteRoom(id) method
- Manages loading state during async operations
- Manages error state and re-throws errors
- Uses $fetch for API calls
- Returns array of rooms from fetchRooms

**Dependencies**: Task 2, Task 4, Task 5, Task 6, Task 7
**Priority**: High

- [x] Completed

---

## Task 9: Update OrganizationRoomSlideover to use real API

Modify `app/components/organization/OrganizationRoomSlideover.vue` to connect form submission to the useRooms composable instead of console.log.

**Success criteria**:

- Import and use useRooms composable
- Replace console.log with createRoom call in handleSubmit
- Set loading state during API call
- Reset form after successful creation
- Display success toast notification on successful creation
- Display error toast notification on failure with French message
- Keep form data intact on error for retry
- Handle cancellation properly
- Use proper TypeScript types for form state

**Dependencies**: Task 5, Task 8
**Priority**: High

- [x] Completed

---

## Task 10: Update OrganizationProfileRoomsTab to use real data

Modify `app/components/organization/OrganizationProfileRoomsTab.vue` to fetch real rooms from API instead of using mock data, and connect delete action to real API.

**Success criteria**:

- Import and use useRooms composable
- Replace mock rooms array with fetchRooms call
- Call fetchRooms when component mounts or on demand
- Display loading state during initial fetch
- Connect delete button to deleteRoom composable method
- Show success toast on successful deletion
- Show error toast on deletion failure
- Update room list and statistics after deletion
- Keep edit and duplicate actions as toast notifications (future enhancement)
- Handle fetch errors with error message display
- Type Room interface matches database schema (remove mock fields like location, status, sessionsToday, icon, color)

**Dependencies**: Task 4, Task 7, Task 8
**Priority**: High

- [x] Completed

---

## Task 11: Add rooms export to schema index

Update `server/database/schema/index.ts` to export the rooms table for use in API endpoints and migrations.

**Success criteria**:

- Import rooms from './rooms'
- Export rooms in the schema index
- Verify exports are accessible in other files

**Dependencies**: Task 1
**Priority**: Medium

- [x] Completed

---

## Task 12: Manual API testing

Test all room API endpoints manually using curl, Postman, or browser dev tools to verify functionality and error handling.

**Success criteria**:

- GET /api/rooms returns array of all rooms
- GET /api/rooms with search parameter filters results
- POST /api/rooms creates room with valid data
- POST /api/rooms returns 400 with invalid data (French error messages)
- PUT /api/rooms/[id] updates room with valid data
- PUT /api/rooms/[id] returns 404 for non-existent room
- DELETE /api/rooms/[id] soft-deletes room
- DELETE /api/rooms/[id] returns 404 for non-existent room
- Organization isolation verified (rooms from org A not visible in org B)
- Soft-deleted rooms not returned in list endpoint
- All endpoints require authentication (401 without auth)

**Dependencies**: Task 4, Task 5, Task 6, Task 7
**Priority**: Medium

---

## Task 13: Manual UI testing

Test the room management UI by creating, listing, and deleting rooms through the application interface.

**Success criteria**:

- Room creation form opens without errors
- Submitting valid form creates room and shows success toast
- Submitting invalid form shows validation errors
- Room list displays real data from API
- Loading states display during API calls
- Delete button removes room and updates list
- Delete button shows success toast
- Errors display toast notifications with French messages
- Form resets after successful creation
- Room card displays correct information (name, description, equipment, capacity, area, prm)

**Dependencies**: Task 9, Task 10, Task 12
**Priority**: Medium

---

## Task 14: Type checking and linting

Run TypeScript type checking and linting tools to ensure code quality and consistency.

**Success criteria**:

- Run typecheck command (tsc or equivalent)
- Fix all TypeScript errors
- Run lint command (eslint or equivalent)
- Fix all linting errors
- Code follows project conventions (2-space tabs, single quotes, PascalCase components, camelCase functions)

**Dependencies**: All previous tasks
**Priority**: Medium

- [x] Completed

---

## Task 15: Update documentation

Update AGENTS.md or other relevant documentation to include the new rooms management feature and composable usage examples.

**Success criteria**:

- Documentation updated with rooms feature description
- useRooms composable documented with usage examples
- API endpoints documented
- Schema structure documented
- Code comments added where necessary for complex logic

**Dependencies**: Task 8, Task 14
**Priority**: Low
