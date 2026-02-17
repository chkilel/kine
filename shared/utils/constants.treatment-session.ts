// =================================================================================================
// Treatment Session Constants
// =================================================================================================

// Valid treatment session statuses (session lifecycle - only in-progress and completed)
export const TREATMENT_SESSION_STATUSES = ['in_progress', 'completed'] as const

// Valid session steps (UI workflow)
export const TREATMENT_SESSION_STEPS = ['pre-session', 'active-session', 'post-session', 'summary'] as const
