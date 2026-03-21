## Context

The treatment session system currently uses a monolithic PATCH endpoint that handles 9 different operations through a union schema. This design has evolved into maintenance burden due to:

- Union schema ordering complexity where schemas with all optional fields must be placed last
- Runtime action detection that adds overhead and creates ambiguous request semantics
- A single composable that imports all 9 actions, reducing tree-shaking benefits
- Testing and debugging complexity due to one endpoint handling multiple operations

The system serves physical therapy clinics where treatment sessions have well-defined state transitions and update operations, making them ideal candidates for RESTful resource-based endpoints.

## Goals / Non-Goals

**Goals:**

- Replace monolithic PATCH endpoint with 9 explicit RESTful endpoints
- Create type-safe, tree-shakeable composables for each action
- Eliminate union schema ordering and action detection complexity
- Improve testing and debugging with isolated endpoints
- Maintain all existing business logic and validation rules
- Preserve state transition constraints and error messages
- Minimize breaking changes to existing functionality

**Non-Goals:**

- Changing treatment session business logic or state transitions
- Modifying validation rules or error messages
- Changing the data model or database schema
- Altering UI/UX behavior (only backend/API changes)
- Adding new treatment session features or capabilities

## Decisions

### 1. RESTful Endpoint Design

**Decision:** Use POST for state transitions and PATCH for field updates

State transitions (start, pause, resume, end, cancel) are modeled as POST endpoints because they represent actions that change the session's lifecycle state. Field updates (tags, extend, cost, clinical-notes) use PATCH as they modify specific fields without changing the session's fundamental state.

```
POST   /api/treatment-sessions/[id]/start          # State transition
POST   /api/treatment-sessions/[id]/pause          # State transition
POST   /api/treatment-sessions/[id]/resume         # State transition
POST   /api/treatment-sessions/[id]/end            # State transition
POST   /api/treatment-sessions/[id]/cancel         # State transition
PATCH  /api/treatment-sessions/[id]/tags          # Field update
PATCH  /api/treatment-sessions/[id]/extend         # Field update
PATCH  /api/treatment-sessions/[id]/cost           # Field update
PATCH  /api/treatment-sessions/[id]/clinical-notes # Field update
```

**Rationale:** This follows REST principles where POST is appropriate for creating a new state or performing an action on a resource, while PATCH is for partial updates to existing resource state. The URL structure makes the action explicit without needing body inspection.

**Alternatives considered:**

- Using PUT for all updates: PUT implies full replacement, not partial updates
- Using POST for all actions: Less explicit about update vs transition semantics
- Query parameter action design (PATCH?id=X&action=start): Less RESTful, harder to cache

### 2. Composable Split Strategy

**Decision:** Create 9 separate composables, each focused on a single action

Each action gets its own composable (e.g., `useStartTreatmentSession`, `usePauseTreatmentSession`) that:

- Uses appropriate endpoint
- Has type-safe request/response handling
- Returns mutation object directly from `useMutation` (no spreading)
- Handles error cases with toast notifications
- Manages query cache invalidation for relevant keys

**Rationale:**

- Better tree-shaking: components import only what they need
- Clearer type inference: each composable has specific input/output types
- Easier to understand and maintain: single responsibility per composable
- Direct mutation return: simpler pattern, follows existing composable conventions in codebase

**Alternatives considered:**

- Single composable with action parameter: Retains the monolithic problem
- Composable per HTTP method (usePostAction, usePatchAction): Less explicit about which action is being performed
- Auto-generated composables from endpoint schema: Too complex for this use case

### 3. Shared Validation Utilities

**Decision:** Extract state transition validation to shared utility function

`validateActionState()` function will be moved to `server/utils/treatment-session-validation.ts` so all endpoints can reuse the same state validation without duplication. This validates business rules like "can't pause a session that's not in_progress".

**Note:** Action detection (`detectActionBySchema()`) is completely eliminated since each endpoint is explicitly for one action.

**Rationale:**

- DRY principle: Avoid repeating validation logic in 9 endpoints
- Single source of truth for state transition business rules
- Easier to test validation logic in isolation
- Consistent error messages across all endpoints

**Alternatives considered:**

- Inline validation in each endpoint: Code duplication, harder to maintain
- Middleware-based validation: Overkill for 9 endpoints, adds complexity
- Zod schema refinement: Already used, but state transitions need runtime validation

### 4. Type Schema Preservation

**Decision:** Keep individual action schemas, remove union schema

The individual schemas (startActionSchema, pauseActionSchema, etc.) are retained in `shared/types/treatment-session.type.ts`. The union schema `treatmentSessionPatchSchema` and `detectActionBySchema()` function are removed.

**Rationale:**

- Individual schemas are still useful for validation in endpoints
- Union schema is no longer needed without action detection
- Cleaner type definitions without ordering constraints
- Better TypeScript inference without complex union types

**Alternatives considered:**

- Keep union schema for backward compatibility: Unnecessary as this is a breaking change
- Move schemas into endpoint files: Reduces type sharing and consistency

### 5. Error Handling Consistency

**Decision:** Maintain existing error messages and status codes

All validation errors, state transition constraints, and error messages from the original implementation are preserved. Each endpoint returns appropriate HTTP status codes (400 for validation errors, 404 for not found, etc.).

**Rationale:**

- No breaking changes to error handling behavior
- Existing UI error handling continues to work
- Consistent user experience
- Easier migration path

**Alternatives considered:**

- Revamp error messages: Unnecessary UX change
- Add new error codes: Overcomplicates error handling

## Migration Plan

### Phase 1: Implementation (No Breaking Changes)

1. Create new endpoint files alongside existing [id].patch.ts
2. Create new composables alongside existing \_useTreatmentSessionActions
3. Test new endpoints and composables thoroughly
4. Update components to use new composables (gradual migration)

### Phase 2: Verification

1. All component imports use new composables
2. No references to old monolithic code remain
3. All tests pass with new implementation

### Phase 3: Cleanup (Breaking Changes)

1. Remove old [id].patch.ts endpoint file
2. Remove old \_useTreatmentSessionActions composable
3. Remove union schema and detectActionBySchema function
4. Remove unused types

### Rollback Plan

If issues arise after deployment:

1. Restore old [id].patch.ts from git
2. Restore old composable implementation
3. Revert component imports (if automated)
4. Database changes: None (this is purely code refactoring)

## Risks / Trade-offs

### Risk 1: Component Migration Complexity

**Risk:** Updating all components to use new composables could introduce bugs if imports or usage patterns change.

**Mitigation:**

- Comprehensive testing of each component after migration
- Return mutation object directly (consistent with existing composables in codebase)
- Migrate components incrementally, testing each one
- Use TypeScript to catch type errors at compile time

### Risk 2: Increased File Count

**Risk:** 9 endpoint files + 9 composables = 18 new files vs 1 endpoint + 1 composable, potentially harder to navigate.

**Mitigation:**

- Clear naming convention makes purpose obvious
- Group files logically (all in same directories)
- Use code folding in editors
- Benefits (isolated, testable, maintainable) outweigh minor navigation cost

### Risk 3: Breaking Change for External Consumers

**Risk:** If external APIs or integrations exist, they will break with this change.

**Mitigation:**

- Check for external API consumers (none known in current system)
- Document breaking change clearly in migration guide
- Provide API compatibility layer if needed (not planning for this as system is internal)

### Trade-off: Code Duplication vs. Clarity

**Trade-off:** Some logic (error handling, query cache invalidation) will be duplicated across endpoints vs. centralized in monolithic handler.

**Decision:** Accept minimal duplication for maximum clarity. Shared state validation utilities reduce business logic duplication, and each endpoint is self-contained and easy to understand.

### Trade-off: HTTP Verb Consistency

**Trade-off:** Using POST for some actions and PATCH for others could confuse developers who expect consistency.

**Decision:** RESTful semantics (POST for state transitions, PATCH for updates) are more important than HTTP method consistency. The URL structure makes the action explicit regardless of method.

## Open Questions

None - The refactoring scope and approach are well-defined based on current implementation.

## Implementation Notes

### File Organization

```
server/api/treatment-sessions/
  ├── [id]/            # Keep existing GET endpoint
  ├── index.post.ts    # Keep existing CREATE endpoint
  ├── start.post.ts    # NEW: Start session
  ├── pause.post.ts    # NEW: Pause session
  ├── resume.post.ts   # NEW: Resume session
  ├── end.post.ts      # NEW: End session
  ├── cancel.post.ts   # NEW: Cancel session
  ├── tags.patch.ts    # NEW: Update tags
  ├── extend.patch.ts  # NEW: Extend duration
  ├── cost.patch.ts    # NEW: Update cost
  └── clinical-notes.patch.ts  # NEW: Update clinical notes

app/composables/
  └── useTreatmentSession.ts  # Will contain 9 focused composables

server/utils/
  └── treatment-session-validation.ts  # NEW: Shared validation logic

shared/types/
  └── treatment-session.type.ts  # Individual action schemas remain
```

### Composable API Pattern

```typescript
// Pattern for all composables - return mutation directly
const useStartTreatmentSession = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async (params: WithOnSuccess<StartParams> & StartAction) => {
      const { sessionId, ...body } = params
      return requestFetch(`/api/treatment-sessions/${sessionId}/start`, {
        method: 'POST',
        body
      })
    },
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      const appointmentId = data?.data?.appointmentId
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.single(sessionId) })
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
      if (appointmentId) {
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.single(appointmentId) })
      }
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de démarrer la séance').message,
        color: 'error'
      })
    }
  })
}

// Usage
const startSession = useStartTreatmentSession()
startSession.mutate(
  { sessionId: '123', actualStartTime: '10:00:00', painLevelBefore: 5 },
  {
    onSuccess: () => {
      /* handle success */
    }
  }
)
```

### Endpoint Implementation Pattern

Each endpoint follows this pattern:

1. Extract session ID and validate authentication
2. Fetch session from database
3. Validate action state using shared utility
4. Validate request body using action-specific schema
5. Execute update logic
6. Handle auto-transitions (finished → completed)
7. Update related entities (appointment status)
8. Return success response with appropriate message
