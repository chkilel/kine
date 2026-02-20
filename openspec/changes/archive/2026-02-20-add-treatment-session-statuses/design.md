# Design: Enhanced Treatment Session Status Workflow

## Context

The treatment session workflow needs better status tracking to capture the full lifecycle of a session. Currently, sessions only have `in_progress` and `completed` statuses, which doesn't properly reflect:

- Preparation phase before the session starts
- Post-session documentation phase after the session ends
- Payment/billing completion
- Cancellation handling

The `sessionStep` field is being removed as it is redundant with the enhanced `status` workflow. The new status values will capture the full session lifecycle without needing a separate step tracking system.

## Goals / Non-Goals

**Goals:**

- Clear separation between session preparation, active treatment, documentation, and payment
- Ability to cancel sessions before they start or during treatment
- Clear indication when billing is complete
- Maintain data integrity with proper state transitions

**Non-Goals:**

- Modifying timing/duration tracking logic
- Changing EVA (pain level) capture requirements
- Maintaining `TREATMENT_SESSION_STEPS` or `sessionStep` field (being removed as redundant)

## Decisions

### Status Lifecycle

```
pre_session → in_progress → finished → completed
      ↓              ↓
    canceled      canceled
```

**Status Transitions:**

1. `pre_session` (initial) - Session created, therapist can add notes/protocol
2. `in_progress` - Active treatment session, timer running
3. `finished` - Session ended, post-session documentation pending
4. `completed` - Session billed and fully finalized
5. `canceled` - Session cancelled (no-show or accidental start)

**Transition Rules:**

- `pre_session` → `in_progress` via start action
- `in_progress` → `finished` via end action
- `finished` → `completed` automatically when `billed` field is set
- `pre_session` → `canceled` via cancel action (no-show)
- `in_progress` → `canceled` via cancel action (accidental start)
- Cannot cancel from `finished` or `completed`
- Cannot cancel if already `canceled`

### Status Configuration

| Status      | Color   | Label (FR)  | Icon                              | Description                               |
| ----------- | ------- | ----------- | --------------------------------- | ----------------------------------------- |
| pre_session | info    | Pré-session | `i-hugeicons-user-check-01`       | Préparation avant la séance               |
| in_progress | warning | En cours    | `i-hugeicons-hourglass`           | Session en cours de traitement            |
| finished    | primary | Terminée    | `i-hugeicons-checkmark-circle-02` | Session terminée (en attente de paiement) |
| completed   | success | Complétée   | `i-hugeicons-checkmark-circle-02` | Session terminée et payée                 |
| canceled    | error   | Annulée     | `i-hugeicons-cancel-01`           | Session annulée                           |

### API Changes

**Create Session:**

- Default status: `pre_session` (changed from `in_progress`)
- `actualStartTime` is not set initially (set when transitioning to `in_progress`)

**Start Action:**

- Preconditions: Status is `pre_session`
- Requires: `painLevelBefore` value (captured via modal confirmation)
- Effect: Status → `in_progress`, `actualStartTime` set, `painLevelBefore` set, timer starts

**End Action:**

- Preconditions: Status is `in_progress`
- Effect: Status → `finished` (changed from `completed`)

**Cancel Action (NEW):**

- Preconditions: Status is `pre_session` or `in_progress`, not already `canceled`
- Effect: Status → `canceled`, clears `pauseStartTime` if set
- Use cases: No-show patient, accidental session start

**Billing Update:**

- When `billed` field is set on a session with status `finished`
- Effect: Status automatically transitions to `completed`
- If status is not `finished`, status remains unchanged

## Risks / Trade-offs

### Risk 1: Breaking Existing Workflows

**Risk**: Frontend code expecting `completed` status after end action will break.

**Mitigation**:

- Identify all places checking for `completed` status
- Update to handle both `finished` and `completed` where appropriate
- Test thoroughly with existing session flows

### Risk 2: Automatic Status Transition Side Effects

**Risk**: Billing a session might have unintended side effects if we auto-transition status.

**Mitigation**:

- Only transition from `finished` to `completed`
- Do not transition if status is something else
- Add comprehensive tests for billing edge cases

### Risk 3: Cancel Action Misuse

**Risk**: Therapists might accidentally cancel sessions instead of ending them.

**Mitigation**:

- Separate UI buttons with clear labels
- Confirmation modal for cancel action
- Cannot cancel from `finished` or `completed`

### Trade-off: Removing SessionStep

**Decision**: Remove `TREATMENT_SESSION_STEPS` constant and `sessionStep` field entirely.

**Rationale**:

- The enhanced status workflow captures the full session lifecycle
- Having both `status` and `sessionStep` creates redundancy and potential confusion
- Simplifies the data model and reduces complexity
- Status-based transitions are sufficient for UI workflow navigation

## Migration Plan

**For Existing Sessions:**

- Sessions with status `in_progress` may need review (should they be `canceled` or restored?)
- Sessions with status `completed` remain `completed`
- No automatic migration needed for `completed` sessions

**For Database:**

- Add new enum values to the `status` column
- Update default value to `pre-session`
- No schema migration needed for existing data (SQLite enum is just text with constraint)

**Rollback Plan:**

- Remove new enum values from constants
- Restore default status to `in_progress`
- Restore end action to set `completed`
- Remove cancel action logic
- Frontend will show error for invalid statuses

## Open Questions

None at this time.
