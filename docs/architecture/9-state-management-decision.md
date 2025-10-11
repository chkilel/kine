# 9) State Management Decision
- For MVP: use Nuxt composables and local component state; avoid global store.
- Introduce Pinia selectively for cross-view state where justified (e.g., auth/session context).
- Documented composables: useAuth, usePatients, useScheduling, useBilling.
