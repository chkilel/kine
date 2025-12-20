// =================================================================================================
// Preferred Days Constants
// =================================================================================================

export const PREFERRED_DAYS_CONFIG = {
  Mon: { label: 'Lundi', short: 'Lun' },
  Tue: { label: 'Mardi', short: 'Mar' },
  Wed: { label: 'Mercredi', short: 'Mer' },
  Thu: { label: 'Jeudi', short: 'Jeu' },
  Fri: { label: 'Vendredi', short: 'Ven' },
  Sat: { label: 'Samedi', short: 'Sam' }
} as const

// Preferred Days Type
export type Days = keyof typeof PREFERRED_DAYS_CONFIG

// Preferred Days Options
export const PREFERRED_DAYS_OPTIONS = Object.entries(PREFERRED_DAYS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Day Abbreviation Helper
export const getDayAbbreviation = (dayOfWeek: Days)=> PREFERRED_DAYS_CONFIG[dayOfWeek].short

// Preferred Day Label Helper
export const getPreferredDayLabel = (day: string) => PREFERRED_DAYS_CONFIG[day as Days].label