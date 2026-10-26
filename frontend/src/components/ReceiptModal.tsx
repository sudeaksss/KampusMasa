import { useEffect, useState } from 'react'
import { FileDown, ShieldCheck, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { Seat } from '../types'
import { locations } from '../data/locations'
import { formatClock, formatDuration } from '../lib/format'
import { buildReceiptPdf } from '../lib/receiptPdf'

type ReceiptModalProps = {
  receiptSeat: Seat
  now: number
  onClose: () => void
}

export function ReceiptModal({ receiptSeat, now, onClose }: ReceiptModalProps) {
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null)
  const [receiptPdfError, setReceiptPdfError] = useState('')

  useEffect(() => {
    let active = true
    let generatedUrl = ''
    setReceiptPdfUrl(null)
    setReceiptPdfError('')
    void buildReceiptPdf(receiptSeat).then((blob) => {
      generatedUrl = URL.createObjectURL(blob)
      if (active) setReceiptPdfUrl(generatedUrl)
      else URL.revokeObjectURL(generatedUrl)
    }).catch(() => {
      if (active) setReceiptPdfError('PDF hazırlanamadı. Fiş ekranda geçerliliğini koruyor.')
    })
    return () => {
      active = false
      if (generatedUrl) window.setTimeout(() => URL.revokeObjectURL(generatedUrl), 60_000)
    }
  }, [receiptSeat])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        <div className="receipt-topline"><span className="receipt-brand-mark"><img src="/logo.png" alt="Logo" className="brand-logo-img" /></span><div className="receipt-brand-copy"><strong>KAMPÜS MASA</strong><span>DİJİTAL KÜTÜPHANE BELGESİ</span></div><span className="receipt-live"><i /> OTURUM AKTİF</span></div>
        <div className="receipt-document-head"><div><span className="section-kicker">MASA KULLANIM FİŞİ</span><h2 id="receipt-title">Oturum onaylandı</h2><p>{locations.find((location) => location.id === receiptSeat.locationId)?.name} · {receiptSeat.table}</p></div><div className="receipt-number-box"><span>FİŞ NUMARASI</span><strong>{receiptSeat.receiptCode ?? '—'}</strong></div></div>
        <div className="receipt-content"><div className="receipt-details"><div className="receipt-detail-row"><span>ÖĞRENCİ NUMARASI</span><strong>{receiptSeat.studentNumber ?? '—'}</strong></div><div className="receipt-detail-row"><span>MASA</span><strong>{receiptSeat.code} · {receiptSeat.area}</strong></div><div className="receipt-detail-row"><span>GİRİŞ SAATİ</span><strong>{formatClock(receiptSeat.checkedInAt)}</strong></div><div className="receipt-detail-row"><span>OTURUM SÜRESİ</span><strong>{formatDuration(receiptSeat.checkedInAt, now)}</strong></div><div className="receipt-detail-row"><span>TAHMİNİ ÇIKIŞ</span><strong>{receiptSeat.estimatedLeaveAt || 'Belirtilmedi'}</strong></div></div><div className="receipt-qr"><QRCodeSVG value={`KUTUPHANE-FIS:${receiptSeat.receiptCode ?? receiptSeat.id}`} size={120} level="Q" includeMargin /><strong>QR DOĞRULAMA</strong><span>Bu fiş, aktif masa oturumuna özeldir.</span></div></div>
        <div className="receipt-status-band"><span className="receipt-status-icon"><ShieldCheck size={17} /></span><div><strong>Masa kullanımı doğrulandı</strong><span>Görevliye göstermek için bu belgeyi açık tutabilir veya PDF indirebilirsin.</span></div><span className="receipt-live"><i /> GEÇERLİ</span></div>
        <div className="receipt-actions"><a className={`primary-action pdf-action ${receiptPdfUrl ? '' : 'pdf-pending'}`} href={receiptPdfUrl ?? undefined} download={`kampus-masa-${receiptSeat.locationId}-${receiptSeat.code.toLowerCase()}-fis.pdf`} aria-disabled={!receiptPdfUrl} onClick={(event) => { if (!receiptPdfUrl) event.preventDefault() }}><FileDown size={17} /> {receiptPdfUrl ? 'PDF olarak indir' : receiptPdfError ? 'PDF hazırlanamadı' : 'PDF hazırlanıyor'}</a><button className="secondary-action" type="button" onClick={onClose}>Kapat</button></div>
        {receiptPdfError && <span className="receipt-pdf-error" role="alert">{receiptPdfError}</span>}
        <div className="receipt-footnote"><ShieldCheck size={14} /> Fiş, oturum kapanana kadar geçerlidir.</div>
      </section>
    </div>
  )
}
