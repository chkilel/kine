# Implementation Tasks

## Database Schema Enhancement

1. **Enhance consultation table schema**
   - Add `location` field with enum values: 'clinic', 'home', 'telehealth'
   - Extend `consultationType` enum with planning types: 'mobilization', 'reinforcement', 'reeducation'
   - Create database migration script for schema changes
   - Update database indexes for new fields if needed

## Type System Updates

2. **Update shared types and schemas**
   - Enhance `consultationCreateSchema` and `consultationUpdateSchema` in `shared/types/patient.types.ts`
   - Add new enum schemas: `consultationLocationSchema` with English values ('clinic', 'home', 'telehealth'), `consultationTypeExtendedSchema`
   - Ensure backward compatibility with existing consultation records
   - Update TypeScript type exports

## API Endpoint Implementation

3. **Create consultation CRUD endpoints**
   - Implement `POST /api/patients/[id]/consultations` for consultation creation
   - Implement `GET /api/patients/[id]/consultations` for listing with pagination and filtering
   - Implement `PUT /api/patients/[id]/consultations/[id]` for updates
   - Implement `DELETE /api/patients/[id]/consultations/[id]` for soft deletion
   - Add proper error handling and validation using Zod schemas

4. **Create treatment plan consultations endpoint**
   - Implement `GET /api/treatment-plans/[id]/consultations` for plan-specific consultations
   - Include progress tracking and statistics in response
   - Support filtering by status and consultation type

## Frontend Component Refactoring

5. **Refactor ConsultationPlanningSlideover component**
   - Replace mock data with real API calls using `useFetch`
   - Implement proper loading and error states
   - Add reactive form validation with Zod schemas
   - Integrate with existing consultation management workflow

6. **Implement manual planning interface**
   - Connect calendar component to real consultation data
   - Implement time slot selection with availability checking
   - Add consultation creation form with enhanced fields
   - Implement consultation list management with CRUD operations

## Integration and Testing

7. **Integrate with existing systems**
   - Ensure proper integration with patient management
   - Connect consultation planning to treatment plan progress tracking
   - Verify multi-tenant data isolation works correctly
   - Test user permissions and authorization

8. **Add comprehensive error handling**
   - Implement user-friendly error messages for API failures
   - Add retry mechanisms for transient errors
   - Provide proper validation feedback in forms
   - Handle edge cases (network issues, data conflicts)

## Documentation and Validation

9. **Update component documentation**
   - Document new consultation planning features
   - Update API endpoint documentation
   - Add usage examples for enhanced consultation schemas

10. **Validate implementation**
    - Test manual consultation planning workflow end-to-end
    - Verify data persistence and consistency
    - Test consultation status management
    - Validate bulk operations functionality
    - Ensure responsive design works correctly on all devices

## Performance Optimization

11. **Optimize database queries**
    - Review and optimize consultation listing queries
    - Ensure proper indexing for new filtering options
    - Implement efficient pagination for large consultation lists

12. **Frontend performance**
    - Implement proper data caching strategies
    - Optimize component re-rendering
    - Add loading skeletons for better perceived performance
