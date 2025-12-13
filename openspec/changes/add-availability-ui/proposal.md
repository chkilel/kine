# Add Availability Management UI to Profile Page

## Summary

This change adds a comprehensive availability management interface to the "Disponibilités" tab in the profile page. The UI will allow therapists to manage their weekly availability templates and specific exceptions (unavailability periods).

## User Story

As a therapist, I want to manage my availability patterns and exceptions so that patients and administrators can accurately see when I'm available for appointments.

## Scope

### In Scope

- Weekly availability template management with day selection, time ranges, location, and max sessions
- Exception management for specific dates with availability toggle and reason
- Responsive table layouts using Nuxt UI components
- Form validation and user feedback
- Integration with existing constants for locations and days

### Out of Scope

- Backend API implementation (this is UI-only as requested)
- Database schema changes
- Real-time availability updates
- Calendar integration
- Recurring exception patterns

## Technical Approach

### UI Components

- Use Nuxt UI Table component for data display
- Nuxt UI Form components for inputs
- Nuxt UI SelectMenu for dropdowns
- Nuxt UI Switch for toggles
- Nuxt UI Button for actions

### Data Structure

- Weekly templates: day, startTime, endTime, location, maxSessions
- Exceptions: date, startTime, endTime, isAvailable, reason

### Integration Points

- Use existing `CONSULTATION_LOCATION_OPTIONS` from constants
- Use existing `PREFERRED_DAYS_OPTIONS` from constants
- Follow existing form patterns from profile tab

## Files to Modify

1. `app/pages/profile.vue` - Replace availability tab placeholder with full UI

## Design Considerations

- Responsive design for mobile and desktop
- Accessible form controls with proper labels
- Consistent styling with existing profile page
- French localization matching existing patterns
- Loading states and error handling

## Success Criteria

- [ ] Availability tab displays weekly templates table
- [ ] Users can add/edit/delete weekly availability entries
- [ ] Users can add/edit/delete exception entries
- [ ] Form validation works correctly
- [ ] UI is responsive and accessible
- [ ] Integration with existing constants works
- [ ] No TypeScript errors
- [ ] Consistent styling with rest of application
