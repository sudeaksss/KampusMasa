import { ChevronDown, KeyRound, LogOut, Moon, Sun } from 'lucide-react'
import type { DashboardView, Location } from '../types'

type TopbarProps = {
  location: Location
  activeView: DashboardView
  studentNumber: string
  accountMenuOpen: boolean
  darkMode: boolean
  onToggleTheme: () => void
  onToggleAccountMenu: () => void
  onLogout: () => void
  onOpenLogin: () => void
}

export function Topbar({ location, activeView, studentNumber, accountMenuOpen, darkMode, onToggleTheme, onToggleAccountMenu, onLogout, onOpenLogin }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>Kampüs</span><span className="crumb-slash">/</span><strong>{activeView === 'map' ? location.name : 'Tüm çalışma noktaları'}</strong></div>
      <div className="topbar-actions">
        <button className="theme-toggle" type="button" aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'} title={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'} onClick={onToggleTheme}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
        <div className="live-indicator"><span /> Canlı doluluk</div>
        {studentNumber ? (
          <div className="account-menu">
            <button className="user-button" type="button" onClick={onToggleAccountMenu} title="Hesap seçenekleri" aria-haspopup="menu" aria-expanded={accountMenuOpen}>
              <span className="user-avatar">{studentNumber.slice(-2)}</span><span className="user-number">{studentNumber}</span><ChevronDown size={15} />
            </button>
            {accountMenuOpen && <div className="account-menu-popover" role="menu"><span className="account-menu-label">ÖĞRENCİ HESABI</span><strong>{studentNumber}</strong><button className="account-logout" type="button" role="menuitem" onClick={onLogout}><LogOut size={15} /> Çıkış yap</button></div>}
          </div>
        ) : <button className="login-button" type="button" onClick={onOpenLogin}><KeyRound size={15} /> Öğrenci girişi</button>}
      </div>
    </header>
  )
}
