# Proposal: Migrate Consultation Slideover to Dedicated Page

## Problem Statement

The current `ActiveConsultationSlideover.vue` component has several critical limitations that hinder the clinical workflow:

1. **Missing Workflow Steps**: Post-session pain assessment and summary/analytics steps are not implemented
2. **Poor State Management**: No URL navigation, cannot bookmark or return to specific session states
3. **Limited Context**: Blocks access to other information (agenda, patient history) during active session
4. **Overlay Overload**: Complex multi-step workflow doesn't fit well in a slideover pattern
5. **No Recovery Path**: Accidental closure loses post-session data (pain level after)

## Proposed Solution

Convert the slideover to a dedicated page at `/consultations/[id]` with explicit state management via URL query parameters.

## Benefits

1. **Complete Workflow**: Implement all 4 steps (pre-session, active session, post-session, summary)
2. **URL Navigation**: Each step has its own URL, enabling browser back/forward and bookmarking
3. **Better Context**: Allows access to other tabs/resources without losing session state
4. **State Recovery**: If tab is accidentally closed, can return to exact step via URL
5. **Cleaner Architecture**: Summary step can be a full page with charts, billing integration
6. **Multi-tab Support**: Therapists can open multiple sessions in different tabs
7. **Mobile/Tablet Friendly**: Full page works better than slideover on smaller screens

## Impact Assessment

### Positive

- Complete clinical workflow implementation
- Better UX for multi-device usage
- Improved state management and recovery
- Easier testing and debugging

### Negative/Risks

- Breaking change for existing slideover integration points
- Requires migration of all open calls to navigateTo instead of overlay
- Need to maintain backward compatibility if needed

### Scope

- Create new page `/pages/consultations/[id].vue`
- Migrate all child components from slideover to page
- Implement missing steps (post-session, summary)
- Update all open calls in `day.vue` and `PlanningSlideover.vue`
- Optional: Keep slideover as a "quick view" mode for read-only sessions

## Alternatives Considered

### Alternative 1: Multi-step Modal

- Pros: Faster to implement
- Cons: Still blocks context, no URL navigation, poor mobile UX

### Alternative 2: Keep Slideover but Add Steps

- Pros: Minimal changes
- Cons: Too complex for slideover, no URL navigation, poor recovery

### Alternative 3: Hybrid (Page + Slideover)

- Pros: Best of both worlds
- Cons: More complex, potential sync issues

**Decision**: Dedicated page provides the best UX for complex multi-step clinical workflow.

## Success Criteria

1. All 4 workflow steps implemented and functional
2. URL navigation works for each step
3. Can return to a session step after accidental closure
4. Billing and next appointment booking integrated
5. Pain differential calculation displayed
6. All existing slideover functionality preserved in page format
7. Responsive design works on mobile/tablet/desktop

## Implementation Timeline

Estimated: 2-3 days

- Day 1: Create page structure, migrate pre-session and active session steps
- Day 2: Implement post-session and summary steps
- Day 3: Update integration points, testing, documentation
