import { Clock3, Medal, Sparkles, Trophy } from 'lucide-react'
import type { DashboardView, Location } from '../types'

type PageIntroProps = {
  location: Location
  activeView: DashboardView
  todayLabel: string
}

export function PageIntro({ location, activeView, todayLabel }: PageIntroProps) {
  return (
    <section className="page-intro">
      <div>
        <div className="eyebrow"><span className="eyebrow-mark">{activeView === 'map' ? <Sparkles size={13} /> : <Trophy size={13} />}</span> {activeView === 'map' ? location.sectionLabel : 'GÜNLÜK SIRALAMA · TÜM ÇALIŞMA NOKTALARI'}</div>
        {activeView === 'map' ? <><h1>Yerini bul.<br /><span>Rahatça çalış.</span></h1><p>{location.name} alanlarını ve boş masaları görüntüle.</p></> : <><h1>Bugünün<br /><span>çalışma liderleri.</span></h1><p>Tüm çalışma noktalarındaki toplam oturum süreleri.</p></>}
      </div>
      <div className="intro-meta"><span className="meta-icon">{activeView === 'map' ? <Clock3 size={17} /> : <Medal size={17} />}</span><div><span>{activeView === 'map' ? 'Bugün çalışma saatleri' : 'Sıralama tarihi'}</span><strong>{activeView === 'map' ? location.hours : todayLabel}</strong></div></div>
    </section>
  )
}
