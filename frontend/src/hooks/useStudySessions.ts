import { useEffect, useMemo, useState } from 'react'
import type { Seat, StudySession } from '../types'
import { readStudySessions, writeStudySessions } from '../lib/storage'

export function useStudySessions(studentNumber: string, seats: Seat[], now: number) {
  const [studySessions, setStudySessions] = useState<StudySession[]>(readStudySessions)

  useEffect(() => {
    writeStudySessions(studySessions)
  }, [studySessions])

  const weeklyStudyDuration = useMemo(() => {
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
    let duration = 0
    const addDuration = (startedAt: number, endedAt: number | null) => {
      const start = Math.max(startedAt, startOfWeek.getTime())
      const end = Math.min(endedAt ?? now, now)
      if (end > start) duration += end - start
    }
    studySessions.forEach((session) => {
      if (session.studentNumber === studentNumber) addDuration(session.startedAt, session.endedAt)
    })
    seats.forEach((seat) => {
      if (seat.status !== 'occupied' || seat.studentNumber !== studentNumber || !seat.checkedInAt) return
      const tracked = studySessions.some((session) => (
        session.studentNumber === studentNumber && session.seatId === seat.id && session.startedAt === seat.checkedInAt
      ))
      if (!tracked) addDuration(seat.checkedInAt, null)
    })
    return duration
  }, [now, seats, studentNumber, studySessions])

  return { studySessions, setStudySessions, weeklyStudyDuration }
}
