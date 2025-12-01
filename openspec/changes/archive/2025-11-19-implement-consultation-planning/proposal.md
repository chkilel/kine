# Treatment Plan Consultations Planning

## Why

The current `ConsultaionPlanningSlideover.vue` component uses hardcoded mock data and local state management, making it impossible to persist consultation schedules. Therapists need a robust system to plan and track consultations within treatment plans, with proper database persistence and type safety.

## What Changes

- Enhance existing consultation schemas to support planning features
- Create API endpoints for consultation CRUD operations
- Update the planning component to use real data
- Add consultation management features (create, update, delete, status changes)

## Summary

Implement treatment plan consultations planning functionality starting with manual planning mode. This feature will replace the mock data in `ConsultaionPlanningSlideover.vue` with real database integration, enabling therapists to schedule and manage patient consultations as part of treatment plans.

## Problem Statement

The current `ConsultaionPlanningSlideover.vue` component uses hardcoded mock data and local state management, making it impossible to persist consultation schedules. Therapists need a robust system to plan and track consultations within treatment plans, with proper database persistence and type safety.

## Proposed Solution

Implement manual consultation planning by:

1. Enhancing existing consultation schemas to support planning features
2. Creating API endpoints for consultation CRUD operations
3. Updating the planning component to use real data
4. Adding consultation management features (create, update, delete, status changes)

## Scope

### In Scope

- Manual consultation planning mode
- Database integration for consultation persistence
- API endpoints for consultation management
- Enhanced consultation schemas with planning-specific fields
- Integration with existing treatment plans
- Consultation status management
- Calendar and time slot selection
- Bulk consultation operations

### Out of Scope

- Automatic consultation generation
- Recurring consultation patterns
- Advanced scheduling algorithms
- Calendar integration with external systems
- Automated reminders and notifications

## Success Criteria

1. Therapists can manually create consultations linked to treatment plans
2. Consultation data persists in the database with proper type safety
3. The planning interface uses real data instead of mock data
4. All consultation operations (CRUD) work correctly
5. Consultation status management functions properly
6. The system maintains data consistency and integrity

## Technical Considerations

- Leverage existing consultation table and schemas
- Enhance schemas with planning-specific fields (location, consultation type, etc.)
- Maintain multi-tenant data isolation
- Ensure proper indexing for performance
- Use existing Zod validation patterns
- Follow established API patterns in the codebase

## Dependencies

- Existing patient and treatment plan management
- Current database schema and relations
- Nuxt UI component library
- Better Auth for authentication and authorization
