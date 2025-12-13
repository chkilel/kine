# Design Document: Availability Slideover Components

## Component Architecture

### 1. AvailabilityTemplateSlideover.vue

**Purpose**: Add or edit weekly availability templates

**Props**:

- `template?: WeeklyAvailabilityTemplate` - Optional template for edit mode

**Events**:

- `close: [result: boolean | WeeklyAvailabilityTemplateCreate]` - Slideover closed with result (false for cancel, data for save)

**Form Sections**:

1. **Timing** - Day of week (`USelect`), start/end times (`UInputTime`)
2. **Location & Capacity** - Consultation location (`USelect`), max simultaneous sessions (`UInputNumber`)
3. **Options** - Recurrence toggle (`USwitch`) (always on for templates)

### 2. AvailabilityExceptionSlideover.vue

**Purpose**: Add or edit availability exceptions/absences

**Props**:

- `exception?: AvailabilityException` - Optional exception for edit mode

**Events**:

- `close: [result: boolean | AvailabilityExceptionCreate]` - Slideover closed with result (false for cancel, data for save)

**Form Sections**:

1. **Date** - Specific date for exception (`UCalendar` as date picker)
2. **Timing** - Optional start/end times (`UInputTime`) (full day if not provided)
3. **Availability** - Available/unavailable toggle (`USwitch`)
4. **Reason** - Exception type/reason (`USelect`)

## Design System Integration

### UI Components

- Use existing Nuxt UI components:
  - `USlideover` for the overlay container
  - `UCard` for form sections
  - `UButton` for actions
  - `UForm` for form wrapper
  - `UFormField` for form field groups with labels
  - `UInputTime` for time inputs (start/end times) - expects `TimeValue | CalendarDateTime | ZonedDateTime` types
  - `USelect` for dropdown selections (day of week, location, reason)
  - `UInputNumber` for numeric inputs (max sessions)
  - `USwitch` for toggles (availability status, full day)
  - `UCalendar` for date selection (exception date) - expects `CalendarDate | CalendarDateTime | ZonedDateTime` types
- Follow existing slideover patterns from `PatientEditSlideover.vue`
- Use consistent spacing, colors, and typography

### Type Safety for Time/Date Inputs

- Use proper `@internationalized/date` types: `Time`, `CalendarDate`, `CalendarDateTime`, `ZonedDateTime`
- Convert string times to proper `Time` objects when needed
- Ensure `UInputTime` receives `TimeValue` types, not strings
- Ensure `UCalendar` receives `CalendarDate` types, not strings
- Use type conversion functions from `@internationalized/date` package

### Overlay Management

- Use Nuxt UI's `useOverlay` composable for programmatic slideover control
- Create overlay instances for both template and exception slideovers
- Components emit `close` event with result data (false for cancel, form data for save)
- Parent components handle overlay results via `await instance.result`
- No manual `isOpen` prop needed - overlay manages its own state
- Ensure proper cleanup and state management

### Color System

- Use Nuxt UI semantic colors: `primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`
- Apply semantic colors based on context (e.g., `success` for save actions, `error` for validation)
- Maintain consistency with existing application color scheme
- Use color variants appropriately (`soft`, `subtle`, `ghost`, `outline`)

### Form Validation

- Visual validation states using Nuxt UI form components
- Client-side validation for required fields
- Time range validation (end > start)
- Use semantic colors for validation states (`error` for invalid, `success` for valid)

### Responsive Design

- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly form controls
- Use Nuxt UI's responsive utilities and breakpoints

## State Management

### Form State

- Use Vue 3 reactive objects for form data
- Computed properties for derived state
- Watch for form validation changes

### Modal Management

- Parent component controls slideover visibility
- Clean form state on open/close
- Handle escape key and backdrop clicks

## Accessibility

### Keyboard Navigation

- Tab order follows form logical flow
- Enter key submits form
- Escape key closes slideover

### Screen Reader Support

- Proper ARIA labels and roles
- Form field descriptions
- Error announcements

## Performance Considerations

### Lazy Loading

- Slideover components only load when needed
- Form validation is debounced
- Minimal re-renders with proper reactive patterns

### Memory Management

- Clean up form state on unmount
- Proper event listener cleanup
- Avoid memory leaks in watchers
