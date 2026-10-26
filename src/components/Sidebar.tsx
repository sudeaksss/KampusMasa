import { ArrowRight, CircleHelp, Clock3, MapPin, ReceiptText, ShieldCheck, Trophy } from 'lucide-react'
import type { DashboardView, Location } from '../types'

type SidebarProps = {
  location?: Location
  activeView: DashboardView
  availableCount: number
  occupiedCount: number
  seatCount: number
  onNavigate: (view: DashboardView) => void
  onOpenReceipt: () => void
}

export function Sidebar({ activeView, availableCount, occupiedCount, seatCount, onNavigate, onOpenReceipt }: SidebarProps) {
  const occupancy = Math.round((occupiedCount / seatCount) * 100)
  return (
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Kampüs Masa ana sayfa">
        <span className="brand-mark"><img src="/logo.png" alt="Kampüs Masa Logo" className="brand-logo-img" /></span>
        <span className="brand-copy"><strong>kampüs masa</strong></span>
      </a>
      <div className="nav-label">ÇALIŞMA ALANI</div>
      <nav className="primary-nav" aria-label="Ana menü">
        <button className={`nav-item ${activeView === 'map' ? 'active' : ''}`} type="button" onClick={() => onNavigate('map')}><MapPin size={18} /> Masa haritası <span className="nav-count">{availableCount}</span></button>
        <button className={`nav-item ${activeView === 'leaderboard' ? 'active' : ''}`} type="button" onClick={() => onNavigate('leaderboard')}><Trophy size={18} /> Günün kazananı</button>
        <button className="nav-item" type="button" onClick={onOpenReceipt}><ReceiptText size={18} /> Fişlerim</button>
      </nav>
      <div className="sidebar-rule" />
      <div className="nav-label">BUGÜN KÜTÜPHANE</div>
      <div className="hours-row"><Clock3 size={16} /><span>Açık · 22.00’ye kadar</span></div>
      <div className="occupancy-block">
        <div className="occupancy-head"><span>Anlık doluluk</span><strong>{occupancy}%</strong></div>
        <div className="occupancy-track"><span style={{ width: `${occupancy}%` }} /></div>
        <small>{occupiedCount} masa kullanımda · {availableCount} masa boş</small>
      </div>
      <div className="sidebar-bottom">
        <div className="help-box"><span className="help-icon"><CircleHelp size={17} /></span><div><strong>Yardıma mı ihtiyacın var?</strong><span>Kütüphane danışma</span></div><ArrowRight size={15} /></div>
        <div className="prototype-note"><ShieldCheck size={14} /> Öğrenci kullanımına özel</div>
      </div>
    </aside>
  )
}
