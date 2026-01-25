import { Time, parseTime } from '@internationalized/date'
import { format } from 'date-fns'

export function getCurrentTimeHHMMSS(): string {
  return format(new Date(), 'HH:mm:ss')
}

export function calculateTimeDifference(startTime: string, endTime: string): number {
  try {
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    const startSeconds = start.hour * 3600 + start.minute * 60 + start.second
    const endSeconds = end.hour * 3600 + end.minute * 60 + end.second

    let diff = endSeconds - startSeconds

    // Handle case where end time is on the next day
    if (diff < 0) {
      diff += 24 * 3600
    }

    return diff
  } catch (error) {
    console.error('Error calculating time difference:', error)
    return 0
  }
}

export function formatSecondsAsTime(seconds: number): Time {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return new Time(hours, minutes, secs)
}

export function formatSecondsAsMMSS(seconds: number): string {
  const time = formatSecondsAsTime(seconds)
  return time.toString().slice(3) // Remove "HH:" to get "MM:SS"
}

export function formatSecondsAsHHMMSS(seconds: number): string {
  const time = formatSecondsAsTime(seconds)

  if (time.hour > 0) {
    return time.toString() // Returns HH:mm:ss format
  }

  return formatSecondsAsMMSS(seconds)
}

export function getTimeSincePause(pauseStartTime: string | null): string {
  if (!pauseStartTime) return ''

  const currentTime = getCurrentTimeHHMMSS()
  const elapsedSeconds = calculateTimeDifference(pauseStartTime, currentTime)

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`
  }

  if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60)
    return `${minutes}min`
  }

  const hours = Math.floor(elapsedSeconds / 3600)
  const remainingMinutes = Math.floor((elapsedSeconds % 3600) / 60)

  return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`
}

export function getCurrentTime(): Time {
  const now = new Date()
  return parseTime(now.toTimeString())
}
