import { ArrowDownRight, DoorOpen, Info, Search, ChevronDown } from 'lucide-react'
import { SeatCard } from './SeatCard'
import type { Location, Seat } from '../types'

type SeatMapProps = {
  location: Location
  floorBadge: string
  locationAreas: string[]
  activeArea: string
  searchQuery: string
  visibleGroups: [string, Seat[]][]
  selectedSeatId: string
  studentNumber: string
  statusLabel: (status: Seat['status']) => string
  onSelectArea: (area: string) => void
  onSearchChange: (query: string) => void
  onSelectSeat: (seatId: string) => void
}

export function SeatMap({
  location,
  floorBadge,
  locationAreas,
  activeArea,
  searchQuery,
  visibleGroups,
  selectedSeatId,
  studentNumber,
  statusLabel,
  onSelectArea,
  onSearchChange,
  onSelectSeat,
}: SeatMapProps) {
  return (
    <section className="map-panel">
      <div className="panel-heading">
        <div><span className="section-kicker">KAT PLANI · {location.name.toLocaleUpperCase('tr-TR')}</span><h2>{location.mapTitle}</h2></div>
        <button className="floor-select" type="button"><span className="floor-icon">{floorBadge}</span> {location.floorLabel} <ChevronDown size={15} /></button>
      </div>
      <div className="map-toolbar">
        <div className="area-tabs" role="tablist" aria-label="Alan seçimi">
          {locationAreas.map((area) => <button className={activeArea === area ? 'area-tab selected' : 'area-tab'} key={area} type="button" role="tab" aria-selected={activeArea === area} onClick={() => onSelectArea(area)}>{area}</button>)}
        </div>
        <label className="map-search"><Search size={15} /><input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Masa ara" aria-label="Masa ara" /><kbd>⌘ K</kbd></label>
      </div>

      <div className="floor-map">
        <div className="map-edge-label"><span>CAM CEPHE</span><span className="window-line" /></div>
        <div className="map-content">
          <div className="map-side-label"><span>SESSİZ ÇALIŞMA</span><span className="side-rail" /></div>
          <div className="table-grid">
            {visibleGroups.map(([tableName, tableSeats], index) => <SeatCard key={tableName} tableName={tableName} seats={tableSeats} index={index} selectedSeatId={selectedSeatId} studentNumber={studentNumber} statusLabel={statusLabel} onSelectSeat={onSelectSeat} />)}
            {visibleGroups.length === 0 && <div className="empty-map"><Search size={20} /><strong>Masa bulunamadı</strong><span>Başka bir masa numarası deneyin.</span></div>}
          </div>
          <div className="map-side-label right-side-label"><span>GRUP ÇALIŞMA</span><span className="side-rail" /></div>
        </div>
        <div className="map-bottom"><span className="door-marker"><DoorOpen size={15} /> GİRİŞ</span><span className="map-dimensions">{location.mapLabel}</span><span className="stairs-marker"><ArrowDownRight size={14} /> Merdiven</span></div>
      </div>

      <div className="map-legend">
        <span><i className="legend-dot available-dot" /> Boş</span><span><i className="legend-dot reserved-dot" /> Rezerve</span><span><i className="legend-dot occupied-dot" /> Dolu</span>
        <span className="legend-hint"><Info size={13} /> Durum için masaya dokun</span>
      </div>
    </section>
  )
}
