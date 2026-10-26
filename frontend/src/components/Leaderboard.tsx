import { Clock3, Megaphone, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import type { LeaderboardRow } from '../types'
import { formatElapsed, formatStudentAlias, getStudentInitials } from '../lib/format'

type LeaderboardProps = {
  rows: LeaderboardRow[]
  todayLabel: string
  activeView: boolean
}

export function Leaderboard({ rows, todayLabel, activeView }: LeaderboardProps) {
  return (
    <section className="leaderboard-view" hidden={activeView} aria-labelledby="leaderboard-title">
      <header className="leaderboard-heading">
        <div><span className="section-kicker">BUGÜN · {todayLabel.toLocaleUpperCase('tr-TR')}</span><h2 id="leaderboard-title">Çalışma sıralaması</h2><p>Aktif ve tamamlanan masa oturumlarının toplamı.</p></div>
        <div className="leaderboard-total"><span>Toplam çalışma</span><strong>{formatElapsed(rows.reduce((total, row) => total + row.duration, 0))}</strong><small>{rows.length} öğrenci</small></div>
      </header>
      <div className="leaderboard-grid">
        <section className="ranking-panel" aria-label="Öğrenci sıralaması">
          <div className="ranking-panel-heading"><div><span className="section-kicker">BUGÜNÜN LİSTESİ</span><h3>En uzun çalışanlar</h3></div><span className="ranking-period"><Clock3 size={13} /> Günlük</span></div>
          <div className="ranking-column-head"><span>SIRA</span><span>ÖĞRENCİ</span><span>SÜRE</span></div>
          {rows.length > 0 ? rows.slice(0, 10).map((row, index) => (
            <div className={`ranking-row ${index === 0 ? 'top-ranked' : ''}`} key={row.studentNumber}>
              <span className="rank-number">{index === 0 ? <Trophy size={16} /> : String(index + 1).padStart(2, '0')}</span>
              <span className="rank-avatar">{getStudentInitials(row.studentNumber)}</span>
              <div className="rank-student"><strong>{formatStudentAlias(row.studentNumber)}</strong><span>{row.active ? 'Şu anda çalışıyor' : 'Oturumunu tamamladı'}</span></div>
              <strong className="rank-duration">{formatElapsed(row.duration)}</strong>
            </div>
          )) : <div className="ranking-empty"><Clock3 size={20} /><strong>Bugün henüz oturum yok</strong><span>İlk çalışma oturumu başladığında sıralama burada görünür.</span></div>}
          <div className="ranking-privacy"><ShieldCheck size={14} /> Çalışma sıralaması günlük oturumlara göre listelenir.</div>
        </section>

        <aside className="leaderboard-side">
          <section className="winner-panel">
            <span className="winner-eyebrow"><Trophy size={14} /> GÜNÜN KAZANANI</span>
            {rows[0] ? <><strong className="winner-name">{formatStudentAlias(rows[0].studentNumber)}</strong><span className="winner-caption">{rows[0].active ? 'Çalışmaya devam ediyor' : 'Bugünkü toplam çalışma süresi'}</span><span className="winner-duration">{formatElapsed(rows[0].duration)}</span></> : <><strong className="winner-name">Henüz belli değil</strong><span className="winner-caption">İlk oturumla birlikte liderlik yarışı başlar.</span></>}
            <span className="winner-ribbon"><Sparkles size={13} /> İstikrarlı çalışma, güzel sonuçlar getirir.</span>
          </section>
          <section className="announcement-section" aria-labelledby="announcements-title">
            <div className="announcement-heading"><Megaphone size={16} /><h3 id="announcements-title">Duyurular</h3></div>
            <div className="announcement-row"><span className="announcement-marker green-marker" /><div><strong>Kütüphane bugün açık</strong><span>Çalışma alanları 22.00’ye kadar kullanılabilir.</span></div></div>
            <div className="announcement-row"><span className="announcement-marker yellow-marker" /><div><strong>Rezervasyon hatırlatması</strong><span>Ayırdığın masaya 15 dakika içinde QR ile giriş yap.</span></div></div>
            {rows[0] && <div className="announcement-row winner-announcement"><span className="announcement-marker coral-marker" /><div><strong>Günün lideri belli oldu</strong><span>{formatStudentAlias(rows[0].studentNumber)} · {formatElapsed(rows[0].duration)}</span></div></div>}
          </section>
        </aside>
      </div>
    </section>
  )
}
