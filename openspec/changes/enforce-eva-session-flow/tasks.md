## 1. EVA Modal Component

- [x] 1.1 Create `AppModalEVA.vue` component with EVA scale slider (0-10)
- [x] 1.2 Include visual gradient (green to red) matching existing EVA UI
- [x] 1.3 Accept props: `title`, `description`, `confirmText`, `initialValue`
- [x] 1.4 Emit `close` event with selected EVA value (or `null` if cancelled)

## 2. Start Session Flow

- [x] 2.1 Update `handleStartSession` in `TreatmentSessionSlideover.vue` to show EVA modal instead of confirm modal
- [x] 2.2 Pass initial EVA value when creating treatment session via API
- [x] 2.3 Session creation starts timer only after EVA is confirmed

## 3. EVA Display Cards

- [x] 3.1 Replace current EVA slider card with read-only "Initial EVA" card showing recorded value
- [x] 3.2 Add "End EVA" placeholder card with note: "Sera demandé avant de terminer la séance"
- [x] 3.3 Both cards visible only when session is in progress

## 4. End Session Flow

- [x] 4.1 Update `handleComplete` in `TreatmentSessionTimer.vue` to show EVA modal
- [x] 4.2 Pass end EVA value when calling `endAsync`
- [x] 4.3 Session completes only after end EVA is recorded

## 5. API & Backend

- [x] 5.1 Update session creation endpoint to accept `painLevelBefore` parameter
- [x] 5.2 Ensure `painLevelBefore` is set at session creation (not after)
- [x] 5.3 Validate `painLevelAfter` is provided when ending session (now required in schema)
