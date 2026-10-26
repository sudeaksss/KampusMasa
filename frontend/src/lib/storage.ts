import type { BreakReport, Seat, StudySession } from '../types'
import { CENTRAL_LOCATION_ID, createInitialSeats } from '../data/locations'

export const SEAT_STORAGE_KEY = 'kampus-masa-seats-v1'
export const STUDY_SESSION_STORAGE_KEY = 'kampus-masa-study-sessions-v1'
export const STUDENT_STORAGE_KEY = 'kampus-masa-student-v1'
export const WEEKLY_GOAL_STORAGE_PREFIX = 'kampus-masa-weekly-goal-v1:'
export const BREAK_REPORT_STORAGE_KEY = 'kampus-masa-break-reports-v1'
export const THEME_STORAGE_KEY = 'kampus-masa-theme-v1'

export function readSeats(): Seat[] {
  try {
    const stored = localStorage.getItem(SEAT_STORAGE_KEY)
    if (stored) {
      const savedSeats = JSON.parse(stored) as Seat[]
      if (Array.isArray(savedSeats) && savedSeats.some((s) => s.studentNumber && s.studentNumber.startsWith('2024'))) {
        localStorage.removeItem(SEAT_STORAGE_KEY)
        return createInitialSeats()
      }
      const migratedSeats = savedSeats.map((seat) => {
        const locationId = seat.locationId ?? CENTRAL_LOCATION_ID
        const seatIdParts = seat.id.split(':')
        const code = seat.code ?? seatIdParts[seatIdParts.length - 1] ?? seat.id
        return {
          ...seat,
          id: seat.locationId ? seat.id : `${locationId}:${code}`,
          code,
          locationId,
          estimatedLeaveAt: seat.estimatedLeaveAt ?? null,
          breakStartedAt: seat.breakStartedAt ?? null,
        }
      })
      const savedLocationIds = new Set(migratedSeats.map((seat) => seat.locationId))
      const newLocations = createInitialSeats().filter((seat) => !savedLocationIds.has(seat.locationId))
      return [...migratedSeats, ...newLocations]
    }
  } catch {
    localStorage.removeItem(SEAT_STORAGE_KEY)
  }
  return createInitialSeats()
}

export function readStudySessions(): StudySession[] {
  try {
    const stored = localStorage.getItem(STUDY_SESSION_STORAGE_KEY)
    if (!stored) return []
    const sessions = JSON.parse(stored) as StudySession[]
    if (Array.isArray(sessions) && sessions.some((s) => s.studentNumber && s.studentNumber.startsWith('2024'))) {
      localStorage.removeItem(STUDY_SESSION_STORAGE_KEY)
      return []
    }
    return Array.isArray(sessions) ? sessions.map((session) => {
      const locationId = session.locationId ?? CENTRAL_LOCATION_ID
      const seatCode = session.seatId ?? ''
      return {
        ...session,
        seatId: session.locationId || !seatCode || seatCode.includes(':') ? seatCode : `${locationId}:${seatCode}`,
        locationId,
        area: session.area ?? '',
      }
    }) : []
  } catch {
    localStorage.removeItem(STUDY_SESSION_STORAGE_KEY)
    return []
  }
}

export function readBreakReports(): BreakReport[] {
  try {
    const stored = localStorage.getItem(BREAK_REPORT_STORAGE_KEY)
    if (!stored) return []
    const reports = JSON.parse(stored) as BreakReport[]
    return Array.isArray(reports) ? reports : []
  } catch {
    localStorage.removeItem(BREAK_REPORT_STORAGE_KEY)
    return []
  }
}

export function writeSeats(seats: Seat[]) {
  localStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(seats))
}

export function writeStudySessions(sessions: StudySession[]) {
  localStorage.setItem(STUDY_SESSION_STORAGE_KEY, JSON.stringify(sessions))
}

export function writeBreakReports(reports: BreakReport[]) {
  localStorage.setItem(BREAK_REPORT_STORAGE_KEY, JSON.stringify(reports))
}

export function readStudentNumber() {
  return localStorage.getItem(STUDENT_STORAGE_KEY) ?? ''
}

export function writeStudentNumber(studentNumber: string) {
  localStorage.setItem(STUDENT_STORAGE_KEY, studentNumber)
}

export function clearStudentNumber() {
  localStorage.removeItem(STUDENT_STORAGE_KEY)
}

export function readWeeklyGoal(studentNumber: string) {
  return Number(localStorage.getItem(`${WEEKLY_GOAL_STORAGE_PREFIX}${studentNumber}`)) || 8
}

export function writeWeeklyGoal(studentNumber: string, goalHours: number) {
  if (studentNumber) localStorage.setItem(`${WEEKLY_GOAL_STORAGE_PREFIX}${studentNumber}`, String(goalHours))
}

export function readDarkMode() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
}

export function writeDarkMode(darkMode: boolean) {
  localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light')
}
