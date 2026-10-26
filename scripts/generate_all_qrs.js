import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { createInitialSeats, locations } from '../server/data/initialSeats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const qrBaseDir = path.join(rootDir, 'public', 'qr-codes')

if (!fs.existsSync(qrBaseDir)) {
  fs.mkdirSync(qrBaseDir, { recursive: true })
}

const seats = createInitialSeats()

async function generate() {
  console.log(`Generating QR codes for ${seats.length} seats...`)

  for (const seat of seats) {
    // Generate payload
    // Format: KUTUPHANE:locationId:floor:seatCode or KUTUPHANE:locationId:seatCode
    const payload = seat.floor
      ? `KUTUPHANE:${seat.locationId}:${seat.floor}:${seat.code}`
      : `KUTUPHANE:${seat.locationId}:${seat.code}`

    // Target folder by location & floor
    const folderName = seat.floor
      ? `${seat.locationId}-kat-${seat.floor}`
      : seat.locationId
    const dirPath = path.join(qrBaseDir, folderName)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const filePath = path.join(dirPath, `${seat.code}.png`)
    await QRCode.toFile(filePath, payload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#183d32',
        light: '#ffffff',
      },
    })

    // Also write top-level shortcuts for backward compatibility
    if (seat.locationId === 'merkez-kutuphanesi' && seat.floor === 2) {
      const topPath = path.join(qrBaseDir, `${seat.code}.png`)
      await QRCode.toFile(topPath, payload, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#183d32',
          light: '#ffffff',
        },
      })
    }
  }

  console.log(`Generated QR codes successfully for all ${seats.length} seats.`)
}

generate().catch(err => {
  console.error('QR generation error:', err)
  process.exit(1)
})
