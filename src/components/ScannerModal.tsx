import { useEffect } from 'react'
import { Info, ScanLine, X } from 'lucide-react'
import type { Location, Seat } from '../types'

type ScannerMode = 'reservation' | 'walk-in' | null

type ScannerModalProps = {
  selectedSeat: Seat
  selectedLocation: Location
  scannerMode: ScannerMode
  scannerMessage: string
  onSetMessage: (message: string) => void
  onClose: () => void
  completeCheckIn: (seatId: string, mode: Exclude<ScannerMode, null>) => void
}

export function ScannerModal({ selectedSeat, selectedLocation, scannerMode, scannerMessage, onSetMessage, onClose, completeCheckIn }: ScannerModalProps) {
  useEffect(() => {
    let active = true
    let scanner: import('html5-qrcode').Html5Qrcode | undefined
    let scannerStart: Promise<unknown> | undefined

    void import('html5-qrcode').then(async ({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
      if (!active) return
      scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })

      const onScanSuccess = (decodedText: string) => {
        if (!active || !scannerMode) return
        const expectedCode = selectedSeat.floor
          ? `KUTUPHANE:${selectedSeat.locationId}:${selectedSeat.floor}:${selectedSeat.code}`
          : `KUTUPHANE:${selectedSeat.locationId}:${selectedSeat.code}`
        const legacyCode1 = `KUTUPHANE:${selectedSeat.locationId}:${selectedSeat.code}`
        const legacyCode2 = `KUTUPHANE:${selectedSeat.code}`
        const cleanDecoded = decodedText.trim()

        if (
          cleanDecoded === expectedCode ||
          cleanDecoded === legacyCode1 ||
          (selectedSeat.locationId === 'merkez-kutuphanesi' && cleanDecoded === legacyCode2)
        ) {
          completeCheckIn(selectedSeat.id, scannerMode)
        } else {
          onSetMessage('Bu QR seçili masaya ait değil. Masanın üzerindeki etiketi okutun.')
        }
      }

      try {
        const devices = await Html5Qrcode.getCameras().catch(() => [])
        if (devices && devices.length > 0) {
          const rearCam = devices.find((d) => {
            const l = (d.label || '').toLowerCase()
            return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('ark')
          })
          const targetCameraId = rearCam ? rearCam.id : devices[devices.length - 1].id
          scannerStart = scanner.start(
            targetCameraId,
            { fps: 10, qrbox: { width: 230, height: 230 } },
            onScanSuccess,
            () => undefined,
          )
        } else {
          scannerStart = scanner.start(
            { facingMode: { exact: 'environment' } },
            { fps: 10, qrbox: { width: 230, height: 230 } },
            onScanSuccess,
            () => undefined,
          ).catch(() => {
            return scanner?.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 230, height: 230 } },
              onScanSuccess,
              () => undefined,
            )
          })
        }
      } catch {
        scannerStart = scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          onScanSuccess,
          () => undefined,
        )
      }

      return scannerStart
    }).catch(() => {
      if (active) onSetMessage('Kamera açılamadı. Tarayıcı izinlerini kontrol edin veya demo okutmayı kullanın.')
    })

    return () => {
      active = false
      if (!scanner) return
      void Promise.resolve(scannerStart)
        .catch(() => undefined)
        .then(async () => {
          if (scanner?.isScanning) await scanner.stop().catch(() => undefined)
          scanner?.clear()
        })
        .catch(() => undefined)
    }
  }, [scannerMode, selectedSeat, completeCheckIn, onSetMessage])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="dialog scanner-dialog" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        <span className="dialog-icon scan-dialog-icon"><ScanLine size={21} /></span><span className="section-kicker">{selectedLocation.name.toLocaleUpperCase('tr-TR')} · MASA {selectedSeat.code}</span><h2 id="scanner-title">QR kodunu tara</h2><p>{scannerMode === 'reservation' ? 'Rezervasyonunu doğrulamak için masanın QR kodunu kamerayla okut.' : 'Oturduğun masayı onaylamak için üzerindeki QR kodunu kamerayla okut.'}</p>
        <div className="scanner-frame"><div id="qr-reader" /><div className="scanner-target"><span /></div></div>
        {scannerMessage && <div className="scanner-message" role="status"><Info size={15} />{scannerMessage}</div>}
        <button className="demo-scan" type="button" onClick={() => scannerMode && completeCheckIn(selectedSeat.id, scannerMode)}><ScanLine size={15} /> Demo: QR okutuldu</button>
        <span className="scanner-caption">Kamera izni bu sayfada kullanılır, görüntü kaydedilmez.</span>
      </section>
    </div>
  )
}
