# Implementation Tasks

## Database Schema Enhancement

- [x] **Enhance consultation table schema**
  - [x] Add `location` field with enum values: 'clinic', 'home', 'telehealth'
  - [x] Extend `consultationType` enum with planning types: 'mobilization', 'reinforcement', 'reeducation'
  - [x] Create database migration script for schema changes
  - [x] Update database indexes for new fields if needed

## Type System Updates

- [x] **Update shared types and schemas**
  - [x] Enhance `consultationCreateSchema` and `consultationUpdateSchema` in `shared/types/patient.types.ts`
  - [x] Add new enum schemas: `consultationLocationSchema` with English values ('clinic', 'home', 'telehealth'), `consultationTypeExtendedSchema`
  - [x] Ensure backward compatibility with existing consultation records
  - [x] Update TypeScript type exports

## API Endpoint Implementation

- [x] **Create consultation CRUD endpoints**
  - [x] Implement `POST /api/patients/[id]/consultations` for consultation creation
  - [x] Implement `GET /api/patients/[id]/consultations` for listing with pagination and filtering
  - [x] Implement `PUT /api/patients/[id]/consultations/[id]` for updates
  - [x] Implement `DELETE /api/patients/[id]/consultations/[id]` for soft deletion
  - [x] Add proper error handling and validation using Zod schemas

- [x] **Create treatment plan consultations endpoint**
  - [x] Implement `GET /api/treatment-plans/[id]/consultations` for plan-specific consultations
  - [x] Include progress tracking and statistics in response
  - [x] Support filtering by status and consultation type

## Frontend Component Refactoring

- [x] **Refactor ConsultationPlanningSlideover component**
  - [x] Replace mock data with real API calls using `useFetch`
  - [x] Implement proper loading and error states
  - [x] Add reactive form validation with Zod schemas
  - [x] Integrate with existing consultation management workflow

- [x] **Implement manual planning interface**
  - [x] Connect calendar component to real consultation data
  - [x] Implement time slot selection with availability checking
  - [x] Add consultation creation form with enhanced fields
  - [x] Implement consultation list management with CRUD operations

## Integration and Testing

- [x] **Integrate with existing systems**
  - [x] Ensure proper integration with patient management
  - [x] Connect consultation planning to treatment plan progress tracking
  - [x] Verify multi-tenant data isolation works correctly
  - [x] Test user permissions and authorization

- [x] **Add comprehensive error handling**
  - [x] Implement user-friendly error messages for API failures
  - [x] Add retry mechanisms for transient errors
  - [x] Provide proper validation feedback in forms
  - [x] Handle edge cases (network issues, data conflicts)

## Documentation and Validation

- [x] **Update component documentation**
  - [x] Document new consultation planning features
  - [x] Update API endpoint documentation
  - [x] Add usage examples for enhanced consultation schemas

- [x] **Validate implementation**
  - [x] Test manual consultation planning workflow end-to-end
  - [x] Verify data persistence and consistency
  - [x] Test consultation status management
  - [x] Validate bulk operations functionality
  - [x] Ensure responsive design works correctly on all devices

## Performance Optimization

- [x] **Optimize database queries**
  - [x] Review and optimize consultation listing queries
  - [x] Ensure proper indexing for new filtering options
  - [x] Implement efficient pagination for large consultation lists

- [x] **Frontend performance**
  - [x] Implement proper data caching strategies
  - [x] Optimize component re-rendering
  - [x] Add loading skeletons for better perceived performance
