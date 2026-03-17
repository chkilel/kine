# Change: Add session price override

## Why

Therapists need to see and modify price for individual treatment sessions. Currently, when opening a session slideover before a session is created, price is not displayed (shows 0). Therapists should see the inherited price based on treatment plan (for plan sessions) or organization defaults (for individual consultations), and be able to override this price when needed.

## What Changes

- Add `cost` field to treatment_sessions table to store session price (in cents)
- Implement price inheritance logic: plan pricing → organization default pricing
- Display inherited price in Treatment Session Slideover before session is created
- Save price when clicking "Démarrer la séance" (start session)
- Allow price modification in session UI using existing PATCH API endpoint
- Add pricing fields to session type definitions and schemas

## Impact

- Affected specs: treatment-session
- Affected code:
  - server/database/schema/treatment-session.ts (add cost field)
  - server/api/treatment-sessions/index.post.ts (calculate and save price)
  - server/api/treatment-sessions/[id].patch.ts (handle cost updates)
  - app/components/treatment-session/SlideoverCenter.vue (display and edit price)
  - shared/types/treatment-session.type.ts (add cost field)
