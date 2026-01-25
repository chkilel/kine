import { timeToMinutes } from './time'
import { MINIMUM_CONSULTATION_GAP_MINUTES } from './constants.consultation'

export const hasTimeConflict = (
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string,
  minGap: number = MINIMUM_CONSULTATION_GAP_MINUTES
): boolean => {
  const existingStartMin = timeToMinutes(existingStart)
  const existingEndMin = timeToMinutes(existingEnd)
  const newStartMin = timeToMinutes(newStart)
  const newEndMin = timeToMinutes(newEnd)

  console.log('🚀 Time conflict check:', {
    existing: { start: existingStart, end: existingEnd, startMin: existingStartMin, endMin: existingEndMin },
    new: { start: newStart, end: newEnd, startMin: newStartMin, endMin: newEndMin },
    minGap
  })

  const newEndsBeforeExisting = newEndMin + minGap <= existingStartMin
  const newStartsAfterExisting = newStartMin >= existingEndMin + minGap
  const noConflict = newEndsBeforeExisting || newStartsAfterExisting

  return !noConflict
}
