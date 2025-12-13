# Implementation Tasks

## 1. Create AvailabilityTemplateSlideover Component

- [ ] Create `app/components/profile/AvailabilityTemplateSlideover.vue`
- [ ] Define component props (template?: WeeklyAvailabilityTemplate)
- [ ] Define component events (close: [result: boolean | WeeklyAvailabilityTemplateCreate])
- [ ] Implement form sections: timing, location & capacity, options
- [ ] Add form validation for required fields and time ranges
- [ ] Use Nuxt UI semantic colors for styling and validation states
- [ ] Use Nuxt UI components (`USlideover`, `UCard`, `UButton`, `UForm`, `UFormField`, `UInputTime`, `USelect`, `UInputNumber`, `USwitch`)
- [ ] Add responsive design for mobile/desktop
- [ ] Ensure component works with useOverlay (no isOpen prop needed)

## 2. Create AvailabilityExceptionSlideover Component

- [ ] Create `app/components/profile/AvailabilityExceptionSlideover.vue`
- [ ] Define component props (exception?: AvailabilityException)
- [ ] Define component events (close: [result: boolean | AvailabilityExceptionCreate])
- [ ] Implement form sections: date, timing, availability, reason
- [ ] Add form validation for required fields and optional times
- [ ] Implement full day toggle functionality
- [ ] Add availability status toggle with reason options
- [ ] Use Nuxt UI semantic colors for styling and validation states
- [ ] Use Nuxt UI components (`USlideover`, `UCard`, `UButton`, `UForm`, `UFormField`, `UInputTime`, `USelect`, `UInputNumber`, `USwitch`, `UCalendar`)
- [ ] Add responsive design for mobile/desktop
- [ ] Ensure component works with useOverlay (no isOpen prop needed)

## 3. Update AvailabilityTab Integration with useOverlay

- [ ] Import `useOverlay` composable in AvailabilityTab.vue
- [ ] Create overlay instances: `const templateOverlay = overlay.create(LazyAvailabilityTemplateSlideover)`
- [ ] Create overlay instances: `const exceptionOverlay = overlay.create(LazyAvailabilityExceptionSlideover)`
- [ ] Replace editTemplate function to use `templateOverlay.open({ template: templateData })`
- [ ] Replace editException function to use `exceptionOverlay.open({ exception: exceptionData })`
- [ ] Update addNewTemplate to use `templateOverlay.open()`
- [ ] Update addNewException to use `exceptionOverlay.open()`
- [ ] Handle overlay results: `const result = await overlayInstance.open()`
- [ ] Process result (false = cancel, data = save) and update local state
- [ ] Ensure proper overlay cleanup (no manual isOpen management needed)

## 4. Validation and Testing

- [ ] Test form validation for both components
- [ ] Test responsive design on different screen sizes
- [ ] Test component props and events integration
- [ ] Verify accessibility features (keyboard navigation, screen readers)
- [ ] Test component behavior with and without initial data
- [ ] Test useOverlay programmatic opening and closing
- [ ] Test overlay return values and event handling

## 5. Code Quality

- [ ] Ensure TypeScript types are properly defined
- [ ] Follow existing code conventions and patterns
- [ ] Add appropriate comments where needed
- [ ] Run linting and type checking
- [ ] Verify no console errors or warnings
- [ ] Ensure proper use of Nuxt UI semantic colors throughout components
- [ ] Verify overlay instances are properly created and managed
