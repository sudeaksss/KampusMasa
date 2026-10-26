import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInitialSeats, locations, CENTRAL_LOCATION_ID } from './data/initialSeats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE = path.join(__dirname, 'data', 'db.json')

function createInitialStudySessions() {
  const now = Date.now()
  return [
    {
      studentNumber: '686', // Kerem Ergin
      seatId: 'merkez-kutuphanesi:1:P-02',
      locationId: 'merkez-kutuphanesi',
      area: 'Pencere kenarı',
      startedAt: now - 5 * 3600_000 - 45 * 60_000,
      endedAt: null,
    },
    {
      studentNumber: '740', // Defne Ergin
      seatId: 'merkez-kutuphanesi:1:P-04',
      locationId: 'merkez-kutuphanesi',
      area: 'Pencere kenarı',
      startedAt: now - 5 * 3600_000 - 15 * 60_000,
      endedAt: now - 15 * 60_000,
    },
    {
      studentNumber: '475', // Eylül Yıldırım
      seatId: 'merkez-kutuphanesi:2:O-01',
      locationId: 'merkez-kutuphanesi',
      area: 'Orta çalışma',
      startedAt: now - 4 * 3600_000 - 30 * 60_000,
      endedAt: null,
    },
    {
      studentNumber: '359', // Ada Yılmaz
      seatId: 'merkez-kutuphanesi:1:P-03',
      locationId: 'merkez-kutuphanesi',
      area: 'Pencere kenarı',
      startedAt: now - 3 * 3600_000 - 50 * 60_000,
      endedAt: now - 10 * 60_000,
    },
    {
      studentNumber: '897', // Zeynep Çetin
      seatId: 'merkez-kutuphanesi:2:S-02',
      locationId: 'merkez-kutuphanesi',
      area: 'Sessiz salon',
      startedAt: now - 3 * 3600_000 - 20 * 60_000,
      endedAt: now - 40 * 60_000,
    },
    {
      studentNumber: '178', // Can Bozkurt
      seatId: 'merkez-kutuphanesi:1:G-01',
      locationId: 'merkez-kutuphanesi',
      area: 'Grup çalışma',
      startedAt: now - 2 * 3600_000 - 45 * 60_000,
      endedAt: null,
    },
    {
      studentNumber: '567', // Sude Kaplan
      seatId: 'merkez-kutuphanesi:1:S-01',
      locationId: 'merkez-kutuphanesi',
      area: 'Sessiz salon',
      startedAt: now - 2 * 3600_000 - 15 * 60_000,
      endedAt: null,
    },
    {
      studentNumber: '306', // Ege Acar
      seatId: 'merkez-kutuphanesi:2:O-03',
      locationId: 'merkez-kutuphanesi',
      area: 'Orta çalışma',
      startedAt: now - 1 * 3600_000 - 50 * 60_000,
      endedAt: now - 20 * 60_000,
    },
    {
      studentNumber: '646', // Elif Erdoğan
      seatId: 'merkez-kutuphanesi:1:P-05',
      locationId: 'merkez-kutuphanesi',
      area: 'Pencere kenarı',
      startedAt: now - 1 * 3600_000 - 30 * 60_000,
      endedAt: now - 10 * 60_000,
    },
    {
      studentNumber: '461', // Arda Taş
      seatId: 'merkez-kutuphanesi:2:S-03',
      locationId: 'merkez-kutuphanesi',
      area: 'Sessiz salon',
      startedAt: now - 1 * 3600_000 - 15 * 60_000,
      endedAt: null,
    },
  ]
}

class Store {
  constructor() {
    this.seats = []
    this.studySessions = []
    this.breakReports = []
    this.weeklyGoals = {}
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        const hasLegacyStudent = Array.isArray(data.seats) && data.seats.some(s => s.studentNumber && s.studentNumber.startsWith('2024'))
        this.seats = (Array.isArray(data.seats) && !hasLegacyStudent) ? data.seats : createInitialSeats()
        this.studySessions = Array.isArray(data.studySessions) && data.studySessions.length >= 5 && !data.studySessions.some(s => s.studentNumber && s.studentNumber.startsWith('2024'))
          ? data.studySessions
          : createInitialStudySessions()
        this.breakReports = Array.isArray(data.breakReports) ? data.breakReports : []
        this.weeklyGoals = data.weeklyGoals || {}
        if (hasLegacyStudent) {
          this.save()
        }
        return
      }
    } catch (err) {
      console.error('Error loading db.json, initializing fresh store:', err)
    }

    this.seats = createInitialSeats()
    this.studySessions = createInitialStudySessions()
    this.breakReports = []
    this.weeklyGoals = {}
    this.save()
  }

  save() {
    try {
      const dataDir = path.dirname(DB_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            seats: this.seats,
            studySessions: this.studySessions,
            breakReports: this.breakReports,
            weeklyGoals: this.weeklyGoals,
          },
          null,
          2
        ),
        'utf-8'
      )
    } catch (err) {
      console.error('Failed to save db.json:', err)
    }
  }

  generateReceiptCode(seat) {
    const locPrefix = seat.locationId ? seat.locationId.slice(0, 2).toUpperCase() : 'KM'
    const codePart = seat.code ? seat.code.replace(/[^A-Z0-9]/gi, '') : 'SEAT'
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    return `KM-2026-${locPrefix}-${codePart}-${randomSuffix}`
  }

  getSeats() {
    return this.seats
  }

  getLocations() {
    return locations
  }

  getSeat(seatId) {
    return this.seats.find((s) => s.id === seatId)
  }

  getStudySessions() {
    return this.studySessions
  }

  getBreakReports() {
    return this.breakReports
  }

  getWeeklyGoal(studentNumber) {
    return this.weeklyGoals[studentNumber] || 8
  }

  setWeeklyGoal(studentNumber, goalHours) {
    if (!studentNumber) return 8
    this.weeklyGoals[studentNumber] = Number(goalHours) || 8
    this.save()
    return this.weeklyGoals[studentNumber]
  }

  reserveSeat({ seatId, studentNumber, groupSize }) {
    if (!studentNumber || typeof studentNumber !== 'string' || studentNumber.trim().length < 4) {
      throw new Error('Geçerli bir öğrenci numarası giriniz.')
    }
    const cleanStudent = studentNumber.trim()

    // Conflict check: student already has an active reservation or seat
    const existingSeat = this.seats.find(
      (s) => s.studentNumber === cleanStudent && (s.status === 'reserved' || s.status === 'occupied') && s.id !== seatId
    )
    if (existingSeat) {
      throw new Error(`Zaten aktif bir masanız (${existingSeat.code}) bulunmaktadır. Aynı anda birden fazla masa ayıramazsınız.`)
    }

    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    if (seat.status !== 'available') {
      throw new Error('Bu masa az önce başka bir öğrenci tarafından rezerve edildi veya dolduruldu.')
    }

    const now = Date.now()
    seat.status = 'reserved'
    seat.studentNumber = cleanStudent
    seat.expiresAt = now + 15 * 60000 // 15 minutes to check in
    seat.receiptCode = this.generateReceiptCode(seat)
    seat.checkedInAt = null
    seat.breakStartedAt = null
    seat.reservationGroupSize = groupSize || null

    this.save()
    return seat
  }

  checkInSeat({ seatId, studentNumber, receiptCode }) {
    if (!studentNumber && !receiptCode) {
      throw new Error('Öğrenci numarası veya rezervasyon fiş kodu gereklidir.')
    }

    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    const now = Date.now()
    const cleanStudent = (studentNumber || '').trim()

    if (seat.status === 'reserved') {
      // Ownership check: must match studentNumber or receiptCode
      const isOwner = (cleanStudent && seat.studentNumber === cleanStudent) || (receiptCode && seat.receiptCode === receiptCode)
      if (!isOwner) {
        throw new Error('Bu masa başka bir öğrenci adına rezerve edilmiştir. Başkasına ait masaya giriş yapamazsınız.')
      }

      seat.status = 'occupied'
      seat.studentNumber = seat.studentNumber || cleanStudent
      seat.checkedInAt = now
      seat.expiresAt = null
      seat.breakStartedAt = null

      this.studySessions.push({
        studentNumber: seat.studentNumber,
        seatId: seat.id,
        locationId: seat.locationId,
        area: seat.area,
        startedAt: now,
        endedAt: null,
      })

      this.save()
      return seat
    }

    if (seat.status === 'available') {
      if (!cleanStudent) {
        throw new Error('Giriş yapmak için lütfen öğrenci numaranızı belirtin.')
      }

      // Check if student already has another occupied seat
      const existing = this.seats.find((s) => s.studentNumber === cleanStudent && s.status === 'occupied')
      if (existing) {
        throw new Error(`Zaten ${existing.code} masasında aktif bir oturumunuz bulunmaktadır.`)
      }

      seat.status = 'occupied'
      seat.studentNumber = cleanStudent
      seat.checkedInAt = now
      seat.expiresAt = null
      seat.receiptCode = this.generateReceiptCode(seat)
      seat.breakStartedAt = null

      this.studySessions.push({
        studentNumber: cleanStudent,
        seatId: seat.id,
        locationId: seat.locationId,
        area: seat.area,
        startedAt: now,
        endedAt: null,
      })

      this.save()
      return seat
    }

    if (seat.status === 'occupied') {
      if (cleanStudent && seat.studentNumber === cleanStudent) {
        return seat // Already checked in
      }
      throw new Error('Bu masa şu anda başka bir öğrenci tarafından kullanılmaktadır.')
    }

    return seat
  }

  releaseSeat({ seatId, studentNumber }) {
    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    if (seat.status === 'available') {
      return seat
    }

    const cleanStudent = (studentNumber || '').trim()
    // Ownership check: student must own this seat
    if (seat.studentNumber && cleanStudent && seat.studentNumber !== cleanStudent) {
      throw new Error('Yalnızca kendi rezerve ettiğiniz veya oturduğunuz masayı boşaltabilirsiniz.')
    }

    const now = Date.now()
    // Close open study sessions for this seat
    if (seat.studentNumber) {
      const openSession = this.studySessions
        .slice()
        .reverse()
        .find((s) => s.seatId === seat.id && s.studentNumber === seat.studentNumber && s.endedAt === null)
      if (openSession) {
        openSession.endedAt = now
      }
    }

    seat.status = 'available'
    seat.studentNumber = null
    seat.expiresAt = null
    seat.checkedInAt = null
    seat.estimatedLeaveAt = null
    seat.receiptCode = null
    seat.breakStartedAt = null
    seat.reservationGroupId = null
    seat.reservationGroupSize = null

    this.save()
    return seat
  }

  startBreak({ seatId, studentNumber }) {
    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    const cleanStudent = (studentNumber || '').trim()
    if (seat.studentNumber !== cleanStudent) {
      throw new Error('Yalnızca kendi masanızda mola başlatabilirsiniz.')
    }

    if (seat.status !== 'occupied') {
      throw new Error('Mola başlatmak için masada oturumunuzun aktif olması gerekir.')
    }

    seat.breakStartedAt = Date.now()
    this.save()
    return seat
  }

  endBreak({ seatId, studentNumber }) {
    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    const cleanStudent = (studentNumber || '').trim()
    if (seat.studentNumber !== cleanStudent) {
      throw new Error('Yalnızca kendi masanızda molayı sonlandırabilirsiniz.')
    }

    seat.breakStartedAt = null
    this.save()
    return seat
  }

  reportBreak({ seatId, reporterStudentNumber }) {
    const seat = this.getSeat(seatId)
    if (!seat) {
      throw new Error('Masa bulunamadı.')
    }

    const cleanReporter = (reporterStudentNumber || '').trim()
    if (!cleanReporter) {
      throw new Error('Mola bildirmek için öğrenci numaranız gereklidir.')
    }

    if (seat.studentNumber === cleanReporter) {
      throw new Error('Kendi masanızı mola aşımı gerekçesiyle bildiremezsiniz.')
    }

    if (!seat.breakStartedAt) {
      throw new Error('Bu masa mola modunda değildir.')
    }

    const elapsed = Date.now() - seat.breakStartedAt
    const THRESHOLD = 20 * 60000 // 20 minutes
    if (elapsed < THRESHOLD) {
      const remainingMinutes = Math.ceil((THRESHOLD - elapsed) / 60000)
      throw new Error(`20 dakikalık yasal mola süresi henüz dolmadı. Kalan süre: ${remainingMinutes} dakika.`)
    }

    const newReport = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      seatId: seat.id,
      reporterStudentNumber: cleanReporter,
      breakStartedAt: seat.breakStartedAt,
      createdAt: Date.now(),
    }
    this.breakReports.push(newReport)

    // Count reports for this seat during this break
    const currentReports = this.breakReports.filter((r) => r.seatId === seat.id && r.breakStartedAt === seat.breakStartedAt)
    let released = false

    // If reported, automatically release seat for other students to use
    if (currentReports.length >= 1) {
      this.releaseSeat({ seatId: seat.id, studentNumber: seat.studentNumber })
      released = true
    } else {
      this.save()
    }

    return { report: newReport, released, seat: this.getSeat(seatId) }
  }

  cleanExpiredReservations() {
    const now = Date.now()
    const expiredSeats = []

    for (const seat of this.seats) {
      if (seat.status === 'reserved' && seat.expiresAt && seat.expiresAt <= now) {
        seat.status = 'available'
        seat.studentNumber = null
        seat.expiresAt = null
        seat.receiptCode = null
        seat.checkedInAt = null
        seat.breakStartedAt = null
        seat.reservationGroupId = null
        seat.reservationGroupSize = null
        expiredSeats.push(seat)
      }
    }

    if (expiredSeats.length > 0) {
      this.save()
    }
    return expiredSeats
  }
}

export const store = new Store()
