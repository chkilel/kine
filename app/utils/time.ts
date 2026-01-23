import { parseTime } from '@internationalized/date'

export function getCurrentTimeHHMMSS(): string {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function calculateTimeDifference(startTime: string, endTime: string): number {
  try {
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    const startSeconds = start.hour * 3600 + start.minute * 60 + start.second
    const endSeconds = end.hour * 3600 + end.minute * 60 + end.second

    let diff = endSeconds - startSeconds

    if (diff < 0) {
      diff += 24 * 3600
    }

    return diff
  } catch (error) {
    console.error('Error calculating time difference:', error)
    return 0
  }
}

export function formatSecondsAsMMSS(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatSecondsAsHHMMSS(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
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

  if (remainingMinutes > 0) {
    return `${hours}h${remainingMinutes}min`
  }

  return `${hours}h`
}
