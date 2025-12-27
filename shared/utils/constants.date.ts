// =================================================================================================
// Preferred Days Constants
// =================================================================================================

export const PREFERRED_DAYS_CONFIG = {
  mon: { label: 'Lundi', short: 'Lun' },
  tue: { label: 'Mardi', short: 'Mar' },
  wed: { label: 'Mercredi', short: 'Mer' },
  thu: { label: 'Jeudi', short: 'Jeu' },
  fri: { label: 'Vendredi', short: 'Ven' },
  sat: { label: 'Samedi', short: 'Sam' }
} as const

// Preferred Days Type
export type Days = keyof typeof PREFERRED_DAYS_CONFIG

// Preferred Days Options
export const PREFERRED_DAYS_OPTIONS = Object.entries(PREFERRED_DAYS_CONFIG).map(([key, item]) => ({
  label: item.label,
  value: key
}))

// Day Abbreviation Helper
export const getDayAbbreviation = (dayOfWeek: Days) => PREFERRED_DAYS_CONFIG[dayOfWeek].short

// Preferred Day Label Helper
export const getPreferredDayLabel = (day: string) => PREFERRED_DAYS_CONFIG[day as Days].label
