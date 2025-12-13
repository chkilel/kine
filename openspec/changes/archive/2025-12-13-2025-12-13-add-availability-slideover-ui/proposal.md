# Add Availability Slideover UI Components

## Summary

Add dedicated slideover components for managing availability time slots and exceptions in the AvailabilityTab.vue. This change will create separate, reusable slideover components that match the design shown in code.html, providing a better user experience for adding and editing availability templates and exceptions.

## Background

Currently, the AvailabilityTab.vue component has placeholder functions for editing templates and exceptions that only show toast messages. The code.html reference shows a well-designed slideover interface for adding availability time slots with comprehensive form fields for timing, location, capacity, and options.

## Proposed Solution

Create two new slideover components:

1. **AvailabilityTemplateSlideover.vue** - For adding/editing weekly availability templates
2. **AvailabilityExceptionSlideover.vue** - For adding/editing availability exceptions

These components will:

- Use existing Nuxt UI design system with semantic colors
- Use Nuxt UI's `useOverlay` composable for programmatic control (no isOpen props)
- Match the visual design from code.html
- Be separate, reusable components
- Handle form validation and state management
- Emit `close` events with result data (false for cancel, form data for save)
- Follow Nuxt UI color conventions (primary, secondary, success, error, neutral)
- Work seamlessly with useOverlay pattern for opening/closing

## Scope

**In Scope:**

- UI components only (no backend logic)
- Form layouts matching code.html design
- Component props and events structure
- Validation UI states
- Responsive design

**Out of Scope:**

- Backend API integration
- Data persistence logic
- Form submission handling
- Error handling from API calls

## Impact

This change will improve the user experience by providing dedicated, well-designed forms for availability management instead of the current placeholder functionality. The components will be reusable and follow the existing project patterns.
