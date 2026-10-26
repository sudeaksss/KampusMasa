import { ArrowRight, Check, Clock3, Info, MapPin, Megaphone, ReceiptText, ScanLine, ShieldCheck, UsersRound, X } from 'lucide-react'
import type { Location, Seat } from '../types'
import { formatDuration, formatTime } from '../lib/format'

type SeatDetailsProps = {
  seat: Seat | undefined
  location: Location
  studentNumber: string
  now: number
  statusLabel: (status: Seat['status']) => string
  estimatedLeaveAt: string
  estimateError: string
  availableGroupSeats: Seat[]
  groupSeatCount: number
  selectedGroupSeatIds: string[]
  breakReportable: boolean
  breakReported: boolean
  onEstimateChange: (value: string) => void
  onEstimateBlur: () => void
  onAction: (action: 'reserve' | 'walk-in') => void
  onOpenReservationScanner: () => void
  onShowReceipt: (seatId: string) => void
  onEndSession: (seat: Seat) => void
  onToggleBreak: (seat: Seat) => void
  onReportBreak: (seat: Seat) => void
  onCancelReservation: (seat: Seat) => void
  onGroupCountChange: (count: number) => void
  onToggleGroupSeat: (seat: Seat) => void
  onGroupReservation: () => void
}

export function SeatDetails({
  seat,
  location,
  studentNumber,
  now,
  statusLabel,
  estimatedLeaveAt,
  estimateError,
  availableGroupSeats,
  groupSeatCount,
  selectedGroupSeatIds,
  breakReportable,
  breakReported,
  onEstimateChange,
  onEstimateBlur,
  onAction,
  onOpenReservationScanner,
  onShowReceipt,
  onEndSession,
  onToggleBreak,
  onReportBreak,
  onCancelReservation,
  onGroupCountChange,
  onToggleGroupSeat,
  onGroupReservation,
}: SeatDetailsProps) {
  return (
    <aside className="detail-panel">
      <div className="detail-header"><div><span className="section-kicker">MASA DETAYI</span><h2>{seat?.code ?? 'Masa seç'}</h2></div>{seat && <span className={`status-pill ${seat.status}`}><i />{statusLabel(seat.status)}</span>}</div>
      {seat && seat.locationId === location.id ? (
        <>
          <div className="selected-location"><span className="location-pin"><MapPin size={17} /></span><div><strong>{location.name} · {seat.table}</strong><span>{location.floorLabel} · {seat.area}</span></div></div>
          <div className={`availability-card ${seat.status}`}>
            <div className="availability-icon">{seat.status === 'available' ? <Check size={19} /> : seat.status === 'reserved' ? <Clock3 size={19} /> : <UsersRound size={19} />}</div>
            <div className="availability-copy">
              <strong>{seat.status === 'available' ? 'Bu masa seni bekliyor' : seat.studentNumber === studentNumber && studentNumber ? 'Bu masa senin' : seat.status === 'reserved' ? 'Kısa süreli rezerve' : 'Şu an kullanımda'}</strong>
              <span>{seat.status === 'available' ? 'Hemen oturabilir veya 15 dk ayırabilirsin.' : seat.status === 'reserved' ? seat.studentNumber === studentNumber ? 'QR’ı okutarak girişini tamamla.' : 'Rezervasyon onaylanınca tekrar boşalabilir.' : seat.studentNumber === studentNumber ? 'E-fişin masanın sana ait olduğunu gösterir.' : 'Bu masada şu anda bir öğrenci çalışıyor.'}</span>
            </div>
          </div>

          {seat.status === 'reserved' && seat.expiresAt && (
            <div className="countdown-card"><span className="countdown-icon"><Clock3 size={17} /></span><div><span>Rezervasyonun bitmesine</span><strong>{formatTime(seat.expiresAt - now)}</strong></div><small>15 dk</small></div>
          )}
          {seat.status === 'reserved' && seat.reservationGroupSize && <div className="group-reservation-note"><UsersRound size={15} /><span>{seat.reservationGroupSize} kişilik grup rezervasyonu · bu masadaki koltukların QR girişini 15 dk içinde tamamlayın.</span></div>}

          <div className="detail-facts"><div><span>Oturma düzeni</span><strong>Bireysel masa</strong></div><div><span>Priz</span><strong className="fact-yes"><Check size={13} /> Var</strong></div></div>

          {(seat.status === 'available' || (seat.status === 'reserved' && seat.studentNumber === studentNumber)) && <>
            <label className="estimate-field"><span>Tahmini çıkış <small>İsteğe bağlı</small></span><input type="text" inputMode="numeric" autoComplete="off" maxLength={5} placeholder="Örn. 18:30" value={estimatedLeaveAt} aria-invalid={Boolean(estimateError)} onBlur={onEstimateBlur} onChange={(event) => onEstimateChange(event.target.value)} /></label>
            {estimateError && <span className="estimate-error" role="alert">{estimateError}</span>}
          </>}

          {seat.status === 'occupied' && <div className="occupancy-facts"><div><span>{seat.breakStartedAt ? 'Mola süresi' : 'Ne zamandır dolu?'}</span><strong>{formatDuration(seat.breakStartedAt ?? seat.checkedInAt, now)}</strong></div><div><span>Tahmini çıkış</span><strong>{seat.estimatedLeaveAt || 'Belirtilmedi'}</strong></div></div>}

          {seat.status === 'available' && <>
            <div className="action-stack"><button className="primary-action" type="button" onClick={() => onAction('reserve')}><Clock3 size={17} /> 15 dk ayır <ArrowRight size={16} /></button><button className="secondary-action" type="button" onClick={() => onAction('walk-in')}><ScanLine size={17} /> QR okutarak otur</button><span className="action-footnote"><Info size={13} /> Oturmadan önce masadaki QR kodunu kamerayla okut.</span></div>
            <section className="group-reservation-control" aria-label="Arkadaş grubu rezervasyonu"><div className="group-reservation-heading"><UsersRound size={16} /><div><strong>Arkadaş grubuna ayır</strong><span>Boş koltukları tek tek seç · aynı çalışma alanı</span></div></div><div className="group-size-select"><span>Kişi sayısı</span><div className="group-size-options" role="group" aria-label="Grup kişi sayısı">{[2, 3, 4].map((count) => <button key={count} className={groupSeatCount === count ? 'selected' : ''} type="button" aria-pressed={groupSeatCount === count} disabled={availableGroupSeats.length < count} onClick={() => onGroupCountChange(count)}>{count}</button>)}</div></div><div className="group-seat-options" role="group" aria-label="Grup koltukları">{availableGroupSeats.map((groupSeat) => <button key={groupSeat.id} className={`group-seat-option ${selectedGroupSeatIds.includes(groupSeat.id) ? 'selected' : ''}`} type="button" aria-pressed={selectedGroupSeatIds.includes(groupSeat.id)} title={`${groupSeat.code} · ${groupSeat.table}`} onClick={() => onToggleGroupSeat(groupSeat)}><strong>{groupSeat.code}</strong><span>{groupSeat.table}</span></button>)}</div><span className="group-selection-count">{selectedGroupSeatIds.length} / {groupSeatCount} koltuk seçildi</span><button className="group-reserve-button" type="button" disabled={selectedGroupSeatIds.length !== groupSeatCount} onClick={onGroupReservation}>Grup için 15 dk ayır <ArrowRight size={15} /></button><span className="group-reservation-hint">QR girişini 15 dakika içinde tamamlamazsanız koltuklar tekrar boşalır.</span></section>
          </>}
          {seat.status === 'reserved' && seat.studentNumber === studentNumber && <div className="action-stack"><button className="primary-action" type="button" onClick={onOpenReservationScanner}><ScanLine size={17} /> Masa QR’ını okut <ArrowRight size={16} /></button><span className="action-footnote"><ShieldCheck size={13} /> 15 dk içinde masadaki QR’ı tarayarak girişini doğrula.</span><button className="secondary-action cancel-reservation-action" type="button" onClick={() => onCancelReservation(seat)}><X size={15} /> Rezervasyonu iptal et</button></div>}
          {seat.status === 'occupied' && seat.studentNumber === studentNumber && <div className="action-stack"><button className="primary-action receipt-action" type="button" onClick={() => onShowReceipt(seat.id)}><ReceiptText size={17} /> E-fişimi göster <ArrowRight size={16} /></button><button className="secondary-action" type="button" onClick={() => onToggleBreak(seat)}><Clock3 size={16} /> {seat.breakStartedAt ? 'Moladan döndüm' : 'Molaya çık'}</button><button className="text-action" type="button" onClick={() => onEndSession(seat)}>Oturumu bitir</button></div>}
          {seat.status === 'occupied' && seat.studentNumber !== studentNumber && seat.breakStartedAt && <div className="action-stack break-report-stack">{breakReportable ? <button className="secondary-action break-report-action" type="button" disabled={breakReported} onClick={() => onReportBreak(seat)}><Megaphone size={15} /> {breakReported ? 'Bildirimin alındı' : '20 dakikayı aşan molayı bildir'}</button> : <span className="action-footnote"><Clock3 size={13} /> Bildirim, mola 20 dakikayı aşınca açılır.</span>}</div>}
          {seat.status !== 'available' && seat.studentNumber !== studentNumber && <div className="quiet-notice"><ShieldCheck size={15} /> Öğrenci bilgileri gizli tutulur.</div>}
        </>
      ) : <div className="empty-detail">Devam etmek için haritadan bir masa seç.</div>}
      <div className="desk-help"><span className="help-dot"><Info size={14} /></span><span>Masanın QR kodunu okut<strong>Oturma onayı masadaki QR taranınca tamamlanır.</strong></span></div>
    </aside>
  )
}
