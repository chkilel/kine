# Design Document: AvailabilityTab UI Modernization

## Architecture Overview

This design document outlines the transformation of the AvailabilityTab.vue component from a table-based interface to a modern card-based layout while maintaining Nuxt UI design patterns.

## Design System Integration

### Color Scheme

- **Primary**: `text-primary` for primary actions and highlights
- **Secondary**: `text-secondary` for secondary elements
- **Success**: `text-success` for available states and positive indicators
- **Warning**: `text-warning` for caution states and domicile location
- **Error**: `text-error` for unavailable states and personal appointments
- **Info**: `text-info` for consultation types and informational elements
- **Text Hierarchy**: `text-default` for main text, `text-muted` for secondary text, `text-dimmed` for subtle text
- **Backgrounds**: `bg-default` for main backgrounds, `bg-elevated` for cards, `bg-accented` for highlights

### Color Mapping Guide

| Element          | Custom Color | Nuxt UI Color  | Usage                        |
| ---------------- | ------------ | -------------- | ---------------------------- |
| Primary actions  | Blue         | `text-primary` | Main buttons, highlights     |
| Success states   | Green        | `text-success` | Available, Cabinet location  |
| Warning states   | Orange/Amber | `text-warning` | Domicile location, Congés    |
| Error states     | Red          | `text-error`   | Unavailable, RDV personnel   |
| Info states      | Blue         | `text-info`    | Téléconsultation, Formation  |
| Secondary text   | Gray         | `text-muted`   | Descriptions, secondary info |
| Subtle text      | Light gray   | `text-dimmed`  | Helper text, placeholders    |
| Main text        | Dark         | `text-default` | Primary content              |
| Card backgrounds | White/Gray   | `bg-elevated`  | Card containers              |
| Hover states     | Light gray   | `bg-accented`  | Interactive hover effects    |

### Component Patterns

- **UCard**: Main container for each availability item
- **UBadge**: Status indicators and location types
- **UButton**: Action buttons with proper variants
- **UIcon**: Icon components for visual indicators
- **USwitch**: Toggle for availability status

## Layout Structure

### Weekly Templates Section

```vue
<UCard>
  <template #header>
    <div class="flex justify-between items-center">
      <div>
        <h2>Modèles de disponibilité hebdomadaire</h2>
        <p class="text-sm text-muted">Horaires récurrents pour ce praticien.</p>
      </div>
      <UButton icon="i-lucide-plus" variant="soft">
        Ajouter une plage
      </UButton>
    </div>
  </template>
  
  <div class="space-y-2">
    <!-- Card items for each template -->
  </div>
</UCard>
```

### Template Item Card

- **Left**: Day indicator with icon
- **Center**: Time range, location badge, capacity info
- **Right**: Action buttons (edit/delete)

### Exceptions Section

Similar structure with date-based visual indicators and availability toggles.

## Visual Elements

### Day Indicators

- Circular or rounded square containers
- Day abbreviation (Lun, Mar, Mer, etc.)
- Calendar icon
- Consistent sizing and spacing

### Status Badges

- **Location**: Cabinet (`text-success`), Domicile (`text-warning`), Téléconsultation (`text-info`)
- **Availability**: Available (`text-success`), Unavailable (`text-error`)
- **Exception Type**: Congés (`text-warning`), Formation (`text-info`), RDV personnel (`text-error`)

### Interactive Elements

- Hover states with `bg-accented` background changes
- Smooth transitions for all interactions
- Action buttons that appear on hover using `text-primary` and `text-error` colors
- Proper focus states with `text-highlighted` for accessibility

## Responsive Design

### Mobile (< 768px)

- Stacked layout for card content
- Full-width cards
- Touch-friendly button sizes
- Simplified information display

### Tablet (768px - 1024px)

- Horizontal card layout
- Optimized spacing
- Balanced information density

### Desktop (> 1024px)

- Full card layout with all elements
- Hover interactions
- Maximum information density

## Accessibility Considerations

- Semantic HTML structure
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- High contrast ratios for text
- Focus indicators for all interactive elements

## Performance Considerations

- Minimal DOM manipulation
- Efficient Vue reactivity patterns
- Optimized icon usage
- CSS transitions instead of JavaScript animations

## Implementation Strategy

1. **Phase 1**: Create base card structure
2. **Phase 2**: Implement visual elements and icons
3. **Phase 3**: Add interactions and animations
4. **Phase 4**: Responsive design optimization
5. **Phase 5**: Accessibility enhancements

## Validation Criteria

- Visual consistency with Nuxt UI design system
- Mobile responsiveness across all breakpoints
- Accessibility compliance (WCAG 2.1 AA)
- Performance benchmarks met
- User testing feedback incorporated
