import { addMinutesToTime, compareTimes } from './time'
import { MINIMUM_CONSULTATION_GAP_MINUTES } from './constants.consultation'

export const hasTimeConflict = (
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string,
  minGap: number = MINIMUM_CONSULTATION_GAP_MINUTES
): boolean => {
  console.log('🚀 Time conflict check:', {
    existing: { start: existingStart, end: existingEnd },
    new: { start: newStart, end: newEnd },
    minGap
  })

  const newEndsWithGap = addMinutesToTime(newEnd, minGap)
  const existingEndsWithGap = addMinutesToTime(existingEnd, minGap)

  const newEndsBeforeExisting = compareTimes(newEndsWithGap, existingStart) <= 0
  const newStartsAfterExisting = compareTimes(newStart, existingEndsWithGap) >= 0
  const noConflict = newEndsBeforeExisting || newStartsAfterExisting

  return !noConflict
}
