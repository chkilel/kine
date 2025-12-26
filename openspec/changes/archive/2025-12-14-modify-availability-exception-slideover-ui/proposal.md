# Change: Modernize AvailabilityExceptionSlideover UI Design

## Why

The current AvailabilityExceptionSlideover component needs to be modernized to match design patterns from AvailabilityTemplateSlideover.vue while preserving all existing props and events interface, ensuring visual consistency across profile components.

## What Changes

- Update component UI to match AvailabilityTemplateSlideover.vue design patterns
- Use UCalendar component for date selection (replacing current UPopover approach)
- Apply color scheme from AvailabilityTemplateSlideover.vue (text-primary, text-foreground, text-muted-foreground, bg-elevated, etc.)
- Preserve all existing props (exception) and emit events (close) without modification
- Use Lucide icons with Nuxt UI components (i-lucide-\* format) as in AvailabilityTemplateSlideover.vue
- Implement card-based layout with proper section headers and icons
- Apply consistent button styling and form field patterns
- Use UForm, UCard, UFormField, USwitch components consistently

## Impact

- Affected specs: availability-exception-slideover
- Affected code: app/components/profile/AvailabilityExceptionSlideover.vue
- **No changes to props interface or emitted events**
- Visual consistency with AvailabilityTemplateSlideover.vue
- Improved user experience with consistent design patterns
