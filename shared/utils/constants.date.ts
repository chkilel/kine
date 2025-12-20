import { createSelectOptions, getLabel, type SelectOption } from "."

// Preferred Days Configuration
export const PREFERRED_DAYS_CONFIG = {
  Mon: 'Lundi',
  Tue: 'Mardi',
  Wed: 'Mercredi',
  Thu: 'Jeudi',
  Fri: 'Vendredi',
  Sat: 'Samedi'
} as const

// Preferred Days Options
export const PREFERRED_DAYS_OPTIONS: SelectOption<string>[] = createSelectOptions(PREFERRED_DAYS_CONFIG)

// Day Abbreviation Helper
export const getDayAbbreviation = (dayOfWeek: string): string => {
  const label = PREFERRED_DAYS_CONFIG[dayOfWeek as keyof typeof PREFERRED_DAYS_CONFIG]
  return label ? label.slice(0, 3) : dayOfWeek
}

// Preferred Day Label Helper
export const getPreferredDayLabel = (day: string): string => getLabel(day as any, PREFERRED_DAYS_CONFIG)