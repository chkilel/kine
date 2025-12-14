# Change: Modernize AvailabilityExceptionSlideover UI Design

## Why

The current AvailabilityExceptionSlideover component needs to be modernized to match the exact design from the HTML reference while preserving all existing props and events interface, ensuring visual consistency with the design system.

## What Changes

- Update component UI to exactly match the HTML reference design (lines 219-383)
- Use UCalendar component for date selection (replacing current UPopover approach)
- Apply the exact color scheme from HTML: primary (#135bec), surface colors, text colors
- Preserve all existing props (exception) and emit events (close) without modification
- Update form layout to match the HTML structure with proper sections
- Use Material Icons as shown in HTML reference (not Nuxt UI icons)
- Implement the exact button styling and hover states from HTML
- Match the calendar design and interaction patterns from HTML

## Impact

- Affected specs: availability-exception-slideover
- Affected code: app/components/profile/AvailabilityExceptionSlideover.vue
- **No changes to props interface or emitted events**
- Visual consistency with HTML reference design
- Improved user experience with exact design matching
