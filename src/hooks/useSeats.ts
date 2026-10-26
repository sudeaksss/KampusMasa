import { useEffect, useState } from 'react'
import type { Seat } from '../types'
import { readSeats, writeSeats } from '../lib/storage'

export function useSeats() {
  const [seats, setSeats] = useState<Seat[]>(readSeats)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      setSeats((previous) => {
        if (!previous.some((seat) => seat.status === 'reserved' && seat.expiresAt !== null && seat.expiresAt <= currentTime)) return previous
        return previous.map((seat) => (
          seat.status === 'reserved' && seat.expiresAt !== null && seat.expiresAt <= currentTime
            ? { ...seat, status: 'available', studentNumber: null, expiresAt: null, estimatedLeaveAt: null, breakStartedAt: null, reservationGroupId: null, reservationGroupSize: null }
            : seat
        ))
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    writeSeats(seats)
  }, [seats])

  return { seats, setSeats, now }
}
