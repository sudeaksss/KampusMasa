import { Check, X } from 'lucide-react'

type NoticeProps = {
  message: string
  onClose: () => void
}

export function Notice({ message, onClose }: NoticeProps) {
  if (!message) return null
  return <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span>{message}<button type="button" onClick={onClose} aria-label="Bildirimi kapat"><X size={15} /></button></div>
}
