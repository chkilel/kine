## Context

The patient billing tab currently shows hardcoded mock data. We need to build a realistic, interactive static UI based on 6 Stitch design reference screens. The UI must use Nuxt UI v4 components and the project's existing overlay/form patterns. No API wiring -- all data is static/mock for now.

## Goals / Non-Goals

**Goals:**

- Replace `facturation.vue` with a rich billing page matching Stitch layouts
- Create 5 overlay components (4 slideovers + 1 modal) using `useOverlay()` pattern
- Reuse existing types (`PaymentForm`, `PaymentRequestBody`, `PaymentMethod`) and constants (`PAYMENT_METHODS_CONFIG`, `PAYMENT_TYPE_CONFIG`)
- Use Nuxt UI components exclusively (no Stitch/Tailwind custom colors)
- Follow existing composable patterns (`createSharedComposable`, `useOverlay()`)
- French-language UI labels matching Stitch reference

**Non-Goals:**

- API wiring (all data stays static/mock)
- Actual payment creation, voiding, or refunding logic
- Invoice generation or document management
- Real-time balance calculations from API
- Pagination or infinite scroll for payment history

## Decisions

### 1. Component Architecture

Each overlay (slideover/modal) follows the existing `useOverlay()` + `LazyXxx` pattern used by 12+ existing slideovers. A `useBillingSlideover()` composable manages all 5 overlays from one place.

**Rationale:** Consistent with codebase patterns; avoids prop-drilling overlay open state through the billing page.

### 2. Billing Page Structure (3-column grid)

The main page uses `grid grid-cols-1 lg:grid-cols-3`:

- Left (2/3): Filter bar + sessions-to-bill section + payment history preview
- Right (1/3): Patient balance card + financial summary card

**Rationale:** Matches Stitch screen 1 layout. Nuxt UI's `AppCard` with `variant="outline"` and `variant="subtle"` replaces Stitch's custom cards.

### 3. Payment Method Selector Pattern

Reuse the icon-button grid pattern from existing `PaymentCard.vue` (lines 66-80) for the deposit and record payment slideovers. The pattern uses native `<button>` elements with dynamic classes rather than a separate Nuxt UI component.

**Rationale:** Already proven in the codebase; consistent UX across payment flows.

### 4. Static Data Approach

Use `ref()` with hardcoded mock data arrays and computed properties. Define mock data inline in each component or in a shared `billingMocks.ts` utility if reused across components.

**Rationale:** Simplest approach; easy to replace with API calls later. No premature abstraction.

### 5. No design.md needed for Stitch color mapping

Nuxt UI v4 provides its own color tokens (`text-default`, `text-muted`, `text-primary`, `bg-primary`, `bg-elevated`, etc.). Stitch colors like `#0045bd`, `surface-container-lowest`, etc. are NOT used. We map Stitch's visual hierarchy to Nuxt UI tokens:

- Primary actions/buttons -> `color="primary"` (Nuxt UI default blue)
- Error states -> `color="error"`
- Warning/partial -> `color="warning"`
- Success/paid -> `color="success"`
- Neutral surfaces -> Nuxt UI's default `UCard`, `bg-muted`, `bg-elevated`

## Risks / Trade-offs

- **Static data disconnect**: Mock data won't reflect real database state. Mitigation: clearly comment mock data sections for easy API replacement.
- **Overlay complexity**: 5 overlays is a lot of new components. Mitigation: each is self-contained with its own mock data; follow existing patterns exactly.

## Open Questions

None -- scope is static UI only.
