// =================================================================================================
// Shared Types
// =================================================================================================

import z from 'zod'

// UI Related Types
export type UIColor = 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'primary' | 'secondary'
export type UIVariant = 'solid' | 'outline' | 'soft' | 'subtle'

// format + real date validation.
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .refine((value) => {
    const d = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(d.getTime())
  }, 'Invalid calendar date')
