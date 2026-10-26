import type { DashboardView, Location } from '../types'

type Counts = { available: number; reserved: number; occupied: number }

type SummaryStripProps = {
  location: Location
  activeView: DashboardView
  counts: Counts
  allCounts: Counts
}

export function SummaryStrip({ location, activeView, counts, allCounts }: SummaryStripProps) {
  const visibleCounts = activeView === 'map' ? counts : allCounts
  return (
    <section className="summary-strip" aria-label={activeView === 'map' ? `${location.name} masa durumları` : 'Tüm kampüs masa durumları'}>
      <div className="summary-title"><span className="summary-live" /> ŞU AN <strong>{activeView === 'map' ? location.shortName : 'TÜM NOKTALAR'}</strong></div>
      <div className="summary-divider" />
      <div className="summary-stat"><span className="summary-dot available-dot" /><span>Boş</span><strong>{visibleCounts.available}</strong></div>
      <div className="summary-stat"><span className="summary-dot reserved-dot" /><span>Rezerve</span><strong>{visibleCounts.reserved}</strong></div>
      <div className="summary-stat"><span className="summary-dot occupied-dot" /><span>Dolu</span><strong>{visibleCounts.occupied}</strong></div>
      <span className="summary-refresh">Güncel <span>şimdi</span></span>
    </section>
  )
}
