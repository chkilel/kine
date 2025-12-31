# add-rooms-management Proposal

## Summary

Add comprehensive rooms management functionality to enable clinic administrators to create, view, edit, and delete treatment rooms within their organization. Rooms will support equipment tracking, accessibility configuration, capacity management, and integration with the existing clinic infrastructure.

## Why

Clinic administrators need the ability to define and catalog their physical treatment spaces to enable effective resource management. This capability will support future room-based scheduling features and provide administrators with tools to track equipment, accessibility features, and capacity constraints for each treatment room. Currently, the application lacks this functionality, and existing UI components rely on mock data that cannot be persisted.

## Problem Statement

Currently, the application lacks the ability to manage clinic treatment rooms. Clinic administrators need to:

1. Define and catalog their physical treatment spaces
2. Track equipment availability in each room
3. Configure room properties (capacity, accessibility, surface area)
4. Enable room selection for consultation scheduling (future)
5. Manage room lifecycle (create, update, delete)

The existing UI components (`OrganizationRoomSlideover.vue` and `OrganizationProfileRoomsTab.vue`) are currently using mock data and need to be connected to a real backend.

## Goals

1. **Database Schema**: Create a `rooms` table with proper indexing and organization scoping
2. **CRUD API**: Implement RESTful endpoints for room management (non-paginated list endpoint)
3. **Type Safety**: Define Zod schemas and TypeScript types for validation
4. **Data Fetching**: Create composable for client-side room data access
5. **UI Integration**: Connect existing UI components to the new API

## Non-Goals

- Room booking/scheduling functionality (future change)
- Room availability calendar (future change)
- Room conflict detection (future change)
- Adding roomId to consultations table (future change)

## Success Criteria

- `rooms` table created and migrated successfully
- All CRUD API endpoints functional and tested
- Room composable fetches data correctly
- Admin UI connected to real API (no more mock data)
- Proper organization isolation and authorization
- French locale support for validation messages

## Out of Scope

- Room-based consultation scheduling (will be addressed in future changes)
- Real-time room availability tracking
- Equipment inventory management beyond basic lists
- Advanced room analytics or reporting

## Risks and Mitigations

### Risk: Deletion of rooms with future bookings

**Mitigation**: Since consultations don't currently have a roomId field, this constraint will be implemented when room-based scheduling is added in a future change. For now, room deletion will use soft-delete pattern for data retention.

### Risk: Equipment list bloat

**Mitigation**: Equipment is stored as a JSON array of strings, allowing flexible categorization without a separate equipment table. Pre-defined equipment list in UI helps maintain consistency.

## Dependencies

- Existing organization and authentication infrastructure
- Drizzle ORM and database migrations
- Nuxt UI components (already implemented)

## Related Work

- Existing UI components: `OrganizationRoomSlideover.vue`, `OrganizationProfileRoomsTab.vue`
- Similar patterns: patients management (CRUD, organization-scoped, soft-delete)
- Multi-tenancy model from organizations and members

## Alternatives Considered

### Option 1: Separate Equipment Table

Store equipment in a dedicated table with many-to-many relationship to rooms.
**Decision**: Rejected - Adds unnecessary complexity for MVP. Equipment is metadata, not a full entity requiring its own lifecycle.

### Option 2: Hard Delete Rooms

Delete room records immediately when deleted.
**Decision**: Rejected - Soft-delete pattern aligns with existing codebase (patients) and provides audit trail for data integrity.

### Option 3: Room Status Management

Add status field (available, occupied, maintenance) similar to patient status.
**Decision**: Deferred - Room availability is dynamic and real-time, better handled through future booking system rather than static status field.
