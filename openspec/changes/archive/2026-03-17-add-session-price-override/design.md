# Design Document

## Context

The treatment session system currently tracks clinical data but does not manage pricing. Therapists need visibility into what session will cost before starting it, and ability to adjust the price when necessary.

### Current State

- treatment_sessions table has no pricing fields (cost does not exist)
- Opening session slideover shows no price information
- Therapists cannot override session prices

### Requirements

1. **Price inheritance**: If session belongs to a treatment plan, inherit from plan.pricing[location]. If individual consultation (no plan), inherit from organization.pricing.sessionRates[location].
2. **Display before creation**: When opening session slideover, show inherited price even though session doesn't exist yet.
3. **Save on start**: When clicking "Démarrer la séance", save the price in the session record.
4. **Allow modification**: Therapist can modify the price in the UI at any time.
5. **Use existing API**: No new API routes; reuse existing PATCH endpoint for updates.

## Goals / Non-Goals

### Goals

- Add cost field to treatment_sessions table
- Implement simple price inheritance (plan → org default)
- Display price in session slideover before creation
- Save price when session starts
- Allow price override via existing PATCH API

### Non-Goals

- Create new API endpoints specifically for price
- Implement complex discount/promotion systems
- Add price history or audit trails
- Automatic price updates when org/plan pricing changes
- Multi-currency support (assume MAD)

## Decisions

### Decision 1: Single cost field

**What**: Add one nullable integer field to treatment_sessions:

- `cost`: stores the session price (inherited or overridden)

**Why**:

- Simpler data model (one field instead of two)
- Clearer semantics: cost is always the current price
- Easier to update (just modify one field)
- No need to distinguish inherited vs manual prices

**Alternatives considered**:

1. Two fields (cost and costOverride): More complex, adds confusion about which price to use
2. JSON `pricing` field with breakdown: Overkill, complex queries
3. Store in metadata: Unclear semantics

### Decision 2: Calculate price on session creation, not on every read

**What**: Calculate inherited price once when session is created (or before creation for display), store in `cost` field.

**Why**:

- Performance: no repeated calculations or database joins
- Simplicity: price is fixed at creation time
- Historical record: preserves price at session start even if org/plan pricing changes later

**Trade-offs**:

- Stale pricing if org/plan pricing updates after session creation
- Need manual override if pricing becomes outdated

**Mitigation**: Therapist can override price anytime via UI.

### Decision 3: Client-side price calculation for UI display

**What**: Calculate inherited price on client using composables to show in slideover before session exists.

**Why**:

- Instant UI feedback (no server round-trip)
- Simpler backend (no special endpoint needed)
- Reuses existing data fetch patterns

**Implementation**: Create `useInheritedPrice()` composable that computes price from appointment, plan, and org data.

### Decision 4: Use existing updateClinicalNotes action for price updates

**What**: Extend existing `updateClinicalNotesActionSchema` to include `cost` field.

**Why**:

- No new API routes (as requested)
- Minimal changes to existing PATCH endpoint
- Reuses existing validation and error handling

**Alternative**: Create separate `updatePriceActionSchema` - rejected as it adds unnecessary complexity.

## Technical Implementation

### Database Schema Changes

Add to treatment_sessions table:

```typescript
// Session price (inherited from plan/org or manually overridden)
cost: integer(),
```

### Price Inheritance Logic

```typescript
function calculateInheritedPrice(params: {
  appointment: Appointment
  treatmentPlan: TreatmentPlan | null
  organization: Organization
}): number {
  const { appointment, treatmentPlan, organization } = params

  // 1. Check treatment plan pricing if session belongs to a plan
  if (treatmentPlan?.pricing) {
    const planPrice = treatmentPlan.pricing[appointment.location]
    if (planPrice) return planPrice
  }

  // 2. Fallback to organization default pricing
  return organization.pricing.sessionRates[appointment.location]
}
```

### Data Models

**Organization pricing structure** (already exists):

```typescript
{
  pricing: {
    sessionRates: {
      clinic: number,      // e.g., 5000 (50 Dh)
      home: number,        // e.g., 6500 (65 Dh)
      telehealth: number    // e.g., 4000 (40 Dh)
    }
  }
}
```

**Treatment plan pricing structure** (already exists):

```typescript
{
  pricing: {
    clinic: number,
    home: number,
    telehealth: number
  }
}
```

**Session pricing structure** (to be added):

```typescript
{
  cost: number | null,    // Session price (cents)
}
```

### API Flow

#### 1. POST /api/treatment-sessions (session creation)

```typescript
// Fetch related data
const [appointment] = await db.select().from(appointments).where(...)
const [organization] = await db.select().from(organizations).where(...)
const [treatmentPlan] = appointment.treatmentPlanId
  ? await db.select().from(treatmentPlans).where(...)
  : null

// Calculate inherited price
const inheritedPrice = calculateInheritedPrice({ appointment, treatmentPlan, organization })

// Create session with price
await db.insert(treatmentSessions).values({
  // ... other fields
  cost: inheritedPrice
})
```

#### 2. PATCH /api/treatment-sessions/[id] (price update)

```typescript
// Extend existing updateClinicalNotesActionSchema
{
  primaryConcern?: string,
  treatmentSummary?: string,
  observations?: string,
  nextSteps?: string,
  cost?: number,           // NEW: allow updating price
}

// Update in PATCH handler
if (cost !== undefined) {
  updateData.cost = cost
}
```

### Frontend Implementation

#### useInheritedPrice composable

```typescript
export function useInheritedPrice(
  appointment: Ref<Appointment | null>,
  treatmentPlan: Ref<TreatmentPlan | null>,
  organization: Ref<Organization | null>
) {
  return computed(() => {
    if (!appointment.value || !organization.value) return null

    const { appointment, treatmentPlan, organization } = {
      appointment: appointment.value,
      treatmentPlan: treatmentPlan.value,
      organization: organization.value
    }

    return calculateInheritedPrice({ appointment, treatmentPlan, organization })
  })
}
```

#### TreatmentSessionSlideoverCenter.vue

```vue
<script setup>
  const inheritedPrice = useInheritedPrice(appointment, treatmentPlan, organization)
  const customPrice = (ref < number) | (null > null)

  // Watch for session data
  watch(
    () => appointment.value?.treatmentSession,
    (session) => {
      if (session) {
        customPrice.value = session.cost
      }
    },
    { immediate: true }
  )

  // Display price
  const displayPrice = computed(() => {
    return customPrice.value ?? inheritedPrice.value
  })

  // Save price override
  function savePrice() {
    updateClinicalNotes({
      sessionId: appointment.value.treatmentSession.id,
      appointmentId: appointment.value.id,
      cost: customPrice.value
    })
  }
</script>

<template>
  <!-- Price Display Section -->
  <UCard>
    <div class="flex items-center justify-between">
      <span class="text-muted">Tarif</span>
      <span class="font-bold">{{ formatCurrency(displayPrice) }}</span>
    </div>

    <!-- Price Edit -->
    <div v-if="session">
      <UInput v-model="customPrice" type="number" placeholder="Prix personnalisé" />
      <UButton @click="savePrice">Modifier le prix</UButton>
    </div>
  </UCard>

  <!-- Clinical Notes (existing) -->
  ...
</template>
```

## Migration Plan

### Phase 1: Database

1. Add `cost` column to treatment_sessions table
2. Run migration

### Phase 2: Backend

1. Implement calculateInheritedPrice utility
2. Update session creation API to calculate and save cost
3. Update session update API to handle cost
4. Add unit tests

### Phase 3: Frontend

1. Add cost to TypeScript types
2. Create useInheritedPrice composable
3. Add price display to session slideover
4. Add price edit functionality
5. Manual testing

### Phase 4: Deployment

1. Deploy to staging environment
2. User acceptance testing
3. Deploy to production

## Risks / Trade-offs

### Risk 1: Client-side calculation mismatch

**Description**: Price calculated on client might differ from server calculation if data is stale.

**Mitigation**:

- Re-fetch session data after creation/start
- Display server-calculated price as source of truth
- Handle discrepancies gracefully in UI

### Risk 2: Performance impact on session creation

**Description**: Additional database joins to fetch organization and plan pricing might slow session creation.

**Mitigation**:

- Ensure proper database indexes on pricing fields
- Monitor query performance
- Consider caching if issues arise

### Risk 3: Stale pricing data

**Description**: Price calculated at session creation may become outdated if org/plan pricing changes later.

**Acceptance**: This is intentional - price is fixed at session start for billing consistency.

**Mitigation**: Therapist can manually override price anytime.

## Open Questions

1. **Should price display show breakdown (org vs plan) or just final price?**
   - Recommendation: Show final price initially, can add breakdown in future if needed

2. **What format for price input? Cents or Dh?**
   - Recommendation: Display in Dh (e.g., 50.00), store as cents (5000)
