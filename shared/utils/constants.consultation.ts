// =================================================================================================
// Consultation Duration and Gap Constants
// =================================================================================================

// Consultation Duration Options
export const CONSULTATION_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120]

// Consultation Gap Options (minutes between sessions)
export const CONSULTATION_GAP_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60] as const

//FIXME this is not necessary: Minimum Gap Between Consultations in Minutes
export const MINIMUM_CONSULTATION_GAP_MINUTES = 15
