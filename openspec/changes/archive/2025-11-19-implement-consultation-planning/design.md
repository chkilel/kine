# Design Document: Treatment Plan Consultations Planning

## Architecture Overview

This enhancement extends the existing consultation system to support manual planning workflows within treatment plans. The design leverages the current database schema while adding planning-specific capabilities.

## Database Schema Enhancements

### Current Consultation Table Analysis

The existing `consultations` table already contains most required fields:

- Basic scheduling: `date`, `startTime`, `endTime`, `duration`
- Clinical data: `sessionType`, `chiefComplaint`, `sessionNotes`
- Status tracking: `status` enum with planning-relevant values
- Relations: `patientId`, `treatmentPlanId`, `therapistId`

### Required Schema Additions

To support the planning workflow, we need to enhance the consultation schema:

```typescript
// Additional fields for consultation planning
location: text({ enum: ['clinic', 'home', 'telehealth'] }), // Planning location preference
consultationType: text({ enum: ['initial', 'follow_up', 'evaluation', 'discharge', 'mobilization', 'reinforcement', 'reeducation'] }), // Extended types
notes: text(), // Additional planning notes
```

## API Design

### Endpoints Structure

Following existing patterns in the codebase:

```
GET    /api/patients/[id]/consultations           # List patient consultations
POST   /api/patients/[id]/consultations           # Create new consultation
GET    /api/patients/[id]/consultations/[id]      # Get specific consultation
PUT    /api/patients/[id]/consultations/[id]      # Update consultation
DELETE /api/patients/[id]/consultations/[id]      # Delete consultation
GET    /api/treatment-plans/[id]/consultations     # Get consultations for treatment plan
```

### Request/Response Patterns

- Use existing Zod schemas for validation
- Follow established error handling patterns
- Maintain organization-based data isolation
- Support pagination and filtering

## Component Architecture

### ConsultationPlanningSlideover Enhancements

The existing component will be refactored to:

1. **Data Layer Integration**
   - Replace mock data with API calls using `useFetch`
   - Implement proper loading and error states
   - Add optimistic updates for better UX

2. **State Management**
   - Use reactive state for form data
   - Implement proper validation with Zod
   - Handle consultation status transitions

3. **UI Enhancements**
   - Maintain existing Nuxt UI components
   - Add proper error handling and validation feedback
   - Implement bulk operations for multiple consultations

### Planning Workflow

1. **Manual Mode** (Initial Implementation)
   - Calendar-based date selection
   - Time slot availability checking
   - Individual consultation creation
   - Status management (scheduled, confirmed, completed, cancelled)

2. **Treatment Plan Integration**
   - Link consultations to existing treatment plans
   - Track progress against planned sessions
   - Display treatment plan context during planning

## Type Safety Strategy

### Schema Enhancement Approach

Instead of creating redundant schemas, we'll enhance the existing ones:

```typescript
// Enhanced consultation schemas in shared/types/patient.types.ts
export const consultationLocationSchema = z.enum(['clinic', 'home', 'telehealth'])
export const consultationTypeExtendedSchema = z.enum([
  'initial',
  'follow_up',
  'evaluation',
  'discharge',
  'mobilization',
  'reinforcement',
  'reeducation'
])

// Extend existing schemas
export const consultationCreateSchema = z.object({
  // ... existing fields
  location: consultationLocationSchema.default('clinic'),
  consultationType: consultationTypeExtendedSchema.default('follow_up'),
  notes: z.string().optional()
})
```

## Performance Considerations

### Database Optimization

- Leverage existing indexes on consultation table
- Add composite indexes for common planning queries
- Implement efficient pagination for large consultation lists

### Frontend Optimization

- Use Nuxt's built-in data fetching optimizations
- Implement proper caching strategies
- Lazy load consultation data when needed

## Security & Multi-tenancy

### Data Isolation

- Maintain organization-based filtering in all queries
- Ensure proper authorization checks
- Validate user permissions for consultation operations

### Input Validation

- Use Zod schemas for all API endpoints
- Sanitize user inputs properly
- Validate consultation data integrity

## Integration Points

### Existing Systems

1. **Patient Management**: Consultations linked to patient records
2. **Treatment Plans**: Optional but recommended association
3. **User Management**: Therapist assignment and permissions
4. **Document System**: Optional document attachments for consultations

### Future Extensibility

- Automatic consultation generation
- Recurring consultation patterns
- Calendar integrations
- Notification systems

## Error Handling Strategy

### API Layer

- Consistent error response format
- Proper HTTP status codes
- Detailed validation error messages

### Frontend Layer

- User-friendly error messages
- Graceful degradation for API failures
- Retry mechanisms for transient errors

## Testing Strategy

### Manual Testing

- Component interaction testing
- API endpoint validation
- Data integrity verification

### Type Safety

- Compile-time error checking with TypeScript
- Runtime validation with Zod schemas
- Database constraint validation
