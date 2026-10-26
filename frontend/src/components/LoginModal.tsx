import type { FormEvent } from 'react'
import { ArrowRight, KeyRound, ShieldCheck, X } from 'lucide-react'

type LoginModalProps = {
  loginValue: string
  loginError: string
  onLoginValueChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

export function LoginModal({ loginValue, loginError, onLoginValueChange, onSubmit, onClose }: LoginModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        <span className="dialog-icon"><KeyRound size={20} /></span><span className="section-kicker">KAMPÜS HESABI</span><h2 id="login-title">Öğrenci girişi</h2><p>Rezervasyon ve masa fişin için öğrenci numaranla devam et.</p>
        <form onSubmit={onSubmit}>
          <label className="input-label" htmlFor="student-number">Öğrenci numarası</label>
          <input id="student-number" className="student-input" value={loginValue} onChange={(event) => onLoginValueChange(event.target.value)} placeholder="Örn. 202412345" inputMode="numeric" autoFocus />
          {loginError && <span className="form-error">{loginError}</span>}
          <button className="primary-action modal-submit" type="submit">Giriş yap <ArrowRight size={16} /></button>
        </form>
        <div className="login-assurance"><ShieldCheck size={15} /><span>Bu prototipte numara yalnızca bu tarayıcıda saklanır.</span></div>
      </section>
    </div>
  )
}
