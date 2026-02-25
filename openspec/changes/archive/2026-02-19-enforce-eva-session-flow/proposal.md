# Change: Enforce EVA Scale at Session Start and End

## Why

Currently, EVA (pain level) is optional and can be set at any time during the session. For better clinical tracking, the therapist must record the patient's pain level at the beginning (pre-treatment) and end (post-treatment) of each session.

## What Changes

- **Start Session**: Replace simple confirmation modal with an EVA scale modal. Session starts only after initial EVA is recorded.
- **During Session**: Display two EVA cards - one showing the recorded initial EVA, another "End EVA" placeholder indicating it will be captured at session end.
- **End Session**: Show EVA modal to capture end pain level before completing the session.

## Impact

- Affected specs: `treatment-session`
- Affected code:
  - `app/components/treatment-session/TreatmentSessionSlideover.vue` - start flow, EVA cards display
  - `app/components/treatment-session/TreatmentSessionTimer.vue` - end session flow
  - New `app/components/app/AppModalEVA.vue` - reusable EVA modal component
