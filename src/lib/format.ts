export function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function formatClock(timestamp: number | null) {
  if (!timestamp) return '—'
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

export function formatDuration(startedAt: number | null, currentTime: number) {
  if (!startedAt) return '—'
  return formatElapsed(currentTime - startedAt)
}

export function formatElapsed(milliseconds: number) {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${minutes} dk`
  return remainingMinutes === 0 ? `${hours} sa` : `${hours} sa ${remainingMinutes} dk`
}

import { getStudentFullName, getStudentInitials } from '../data/students'

export function formatStudentAlias(studentNumber: string) {
  return getStudentFullName(studentNumber)
}

export { getStudentFullName, getStudentInitials }

export function isValidClockTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}
