import { Armchair } from 'lucide-react'
import type { Seat } from '../types'

type SeatCardProps = {
  tableName: string
  seats: Seat[]
  index: number
  selectedSeatId: string
  studentNumber: string
  statusLabel: (status: Seat['status']) => string
  onSelectSeat: (seatId: string) => void
}

export function SeatCard({ tableName, seats, index, selectedSeatId, studentNumber, statusLabel, onSelectSeat }: SeatCardProps) {
  function renderSeat(seat: Seat) {
    return <button key={seat.id} className={`seat ${seat.status} ${selectedSeatId === seat.id ? 'is-selected' : ''} ${seat.studentNumber === studentNumber && studentNumber ? 'mine' : ''}`} onClick={() => onSelectSeat(seat.id)} type="button" aria-label={`${seat.code}, ${statusLabel(seat.status)}`} title={`${seat.code} · ${statusLabel(seat.status)}`}><span>{seat.code.slice(-2)}</span></button>
  }

  return (
    <article className={`table-card table-card-${index % 4}`}>
      <div className="table-card-heading"><span className="table-symbol"><Armchair size={15} /></span><div><strong>{tableName}</strong><small>{seats[0]?.area}</small></div><span className="table-capacity">{seats.filter((seat) => seat.status === 'available').length}/{seats.length}</span></div>
      <div className="table-layout">
        <div className="seat-row">{seats.slice(0, 2).map(renderSeat)}</div>
        <div className="desk-surface"><span className="desk-notch" /><span>{tableName.replace(' ', '\u00a0')}</span><span className="desk-notch" /></div>
        <div className="seat-row">{seats.slice(2, 4).map(renderSeat)}</div>
      </div>
    </article>
  )
}
