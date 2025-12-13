# Design Document: Availability Management UI

## Overview

This design document outlines the implementation approach for adding availability management functionality to the profile page. The feature will allow therapists to manage their weekly availability patterns and specific exceptions through a clean, intuitive interface.

## Architecture

### Component Structure

```
Profile Page (existing)
├── Tabs (existing)
│   ├── Profile Tab (existing)
│   ├── Availability Tab (NEW)
│   │   ├── Weekly Templates Section
│   │   │   ├── Templates Table
│   │   │   └── Add Template Form
│   │   ├── Exceptions Section
│   │   │   ├── Exceptions Table
│   │   │   └── Add Exception Form
│   │   └── Action Buttons (Save/Cancel)
│   └── Statistics Tab (placeholder)
```

### Data Models

#### Weekly Availability Template

```typescript
interface WeeklyAvailabilityTemplate {
  id: string
  dayOfWeek: string // 'Mon', 'Tue', etc.
  startTime: string // '09:00'
  endTime: string // '12:00'
  location: ConsultationLocation
  maxSessions: number
}
```

#### Exception

```typescript
interface AvailabilityException {
  id: string
  date: string // '2024-08-15'
  startTime?: string // optional for full day
  endTime?: string // optional for full day
  isAvailable: boolean
  reason?: string
}
```

## UI Design Decisions

### 1. Layout Structure

- Use Nuxt UI Card components for each section
- Implement responsive tables with horizontal scrolling on mobile
- Follow existing spacing and typography patterns from profile page

### 2. Form Controls

- **Day Selection**: Use SelectMenu with PREFERRED_DAYS_OPTIONS
- **Time Inputs**: Use InputTime component for start/end times
- **Location**: Use SelectMenu with CONSULTATION_LOCATION_OPTIONS
- **Max Sessions**: Use InputNumber with min=1, max=10
- **Date Picker**: Use InputDate for exception dates
- **Availability Toggle**: Use Switch component

### 3. Table Design

- Use Nuxt UI Table component with consistent styling
- Include action buttons (edit/delete) in last column
- Add hover states for better UX
- Implement empty states when no data exists

### 4. Interaction Patterns

- **Inline Editing**: Click-to-edit functionality for table rows
- **Modal Forms**: Use Slideover or Modal for adding new entries
- **Confirmation**: Use toast notifications for save/delete actions
- **Validation**: Real-time form validation with error messages

## Technical Implementation

### State Management

```typescript
// Reactive state for availability data
const weeklyTemplates = ref<WeeklyAvailabilityTemplate[]>([])
const exceptions = ref<AvailabilityException[]>([])

// Form state for adding/editing
const templateForm = reactive<Partial<WeeklyAvailabilityTemplate>>({})
const exceptionForm = reactive<Partial<AvailabilityException>>({})
```

### Form Validation

- Use Zod schemas for validation
- Validate time ranges (end > start)
- Validate session limits (positive integers)
- Validate date formats and future dates for exceptions

### Integration Points

1. **Constants**: Import from `shared/utils/constants.ts`
2. **Types**: Define in `shared/types/` if needed
3. **Styling**: Use Nuxt UI design tokens
4. **Icons**: Use Lucide icons from Nuxt UI

## Responsive Design

### Desktop (>768px)

- Full table display with all columns
- Side-by-side layout for form sections
- Fixed action buttons at bottom

### Mobile (<768px)

- Horizontal scrollable tables
- Stacked form layouts
- Sticky action buttons
- Simplified table views with essential columns

## Accessibility Considerations

- Semantic HTML structure
- Proper ARIA labels for form controls
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios
- Focus management in modals

## Performance Considerations

- Lazy load form components
- Debounce form validation
- Optimize re-renders with proper keys
- Minimal bundle impact by using existing Nuxt UI components

## Future Extensibility

- Backend API integration points ready
- Component structure allows for easy feature additions
- Type-safe interfaces for future data models
- Modular design for testing and maintenance
