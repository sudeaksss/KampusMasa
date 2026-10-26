import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import { store } from './store.js'
import { authManager } from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'INIT',
      payload: {
        seats: store.getSeats(),
        studySessions: store.getStudySessions(),
        breakReports: store.getBreakReports(),
      },
      timestamp: Date.now(),
    })
  )

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }))
      }
    } catch {
      // Ignore invalid websocket payloads
    }
  })
})

// Periodic check for expired reservations (runs every 10 seconds)
setInterval(() => {
  const expiredSeats = store.cleanExpiredReservations()
  if (expiredSeats.length > 0) {
    broadcast('SEATS_BATCH_UPDATED', expiredSeats)
  }
}, 10000)

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now() })
})

app.post('/api/login', (req, res) => {
  try {
    const { studentNo, password } = req.body
    const result = authManager.login(studentNo, password)
    res.json({
      success: true,
      studentNo: result.studentNo,
      firstName: result.firstName,
      lastName: result.lastName,
      fullName: result.fullName,
      message: 'Giriş başarılı.',
    })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

app.get('/api/bootstrap', (req, res) => {
  res.json({
    seats: store.getSeats(),
    locations: store.getLocations(),
    studySessions: store.getStudySessions(),
    breakReports: store.getBreakReports(),
    studentNumbers: authManager.getAllStudentNumbers(),
  })
})

app.get('/api/verify-student/:studentNo', (req, res) => {
  const user = authManager.getUser(req.params.studentNo)
  if (!user) {
    return res.status(404).json({ valid: false, error: 'Kayıtsız öğrenci.' })
  }
  res.json({
    valid: true,
    studentNo: user.student_no,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`,
  })
})

app.get('/api/seats', (req, res) => {
  res.json(store.getSeats())
})

app.post('/api/reserve', (req, res) => {
  try {
    const { seatId, studentNumber, groupSize } = req.body
    if (!studentNumber || !authManager.getUser(studentNumber)) {
      return res.status(403).json({ error: 'Sistemde böyle bir kayıt bulunamadı.' })
    }
    const updatedSeat = store.reserveSeat({ seatId, studentNumber, groupSize })
    broadcast('SEAT_UPDATED', updatedSeat)
    res.json({
      success: true,
      message: 'Masa adiniza rezerve edildi.',
      seat: updatedSeat,
    })
  } catch (err) {
    res.status(409).json({ error: err.message })
  }
})

app.post('/api/check-in', (req, res) => {
  try {
    const { seatId, studentNumber, receiptCode } = req.body
    if (studentNumber && !authManager.getUser(studentNumber)) {
      return res.status(403).json({ error: 'Sistemde böyle bir kayıt bulunamadı.' })
    }
    const updatedSeat = store.checkInSeat({ seatId, studentNumber, receiptCode })
    broadcast('SEAT_UPDATED', updatedSeat)
    broadcast('STUDY_SESSIONS_SYNC', store.getStudySessions())
    res.json({
      success: true,
      message: 'Giris yapildi. Iyi calismalar.',
      seat: updatedSeat,
    })
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
})

app.post('/api/release', (req, res) => {
  try {
    const { seatId, studentNumber } = req.body
    const updatedSeat = store.releaseSeat({ seatId, studentNumber })
    broadcast('SEAT_UPDATED', updatedSeat)
    broadcast('STUDY_SESSIONS_SYNC', store.getStudySessions())
    res.json({
      success: true,
      message: 'Masa basariyla bosaltildi.',
      seat: updatedSeat,
    })
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
})

app.post('/api/break/start', (req, res) => {
  try {
    const { seatId, studentNumber } = req.body
    const updatedSeat = store.startBreak({ seatId, studentNumber })
    broadcast('SEAT_UPDATED', updatedSeat)
    res.json({
      success: true,
      message: 'Mola baslatildi. 20 dakika icerisinde masaniza donunuz.',
      seat: updatedSeat,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/break/end', (req, res) => {
  try {
    const { seatId, studentNumber } = req.body
    const updatedSeat = store.endBreak({ seatId, studentNumber })
    broadcast('SEAT_UPDATED', updatedSeat)
    res.json({
      success: true,
      message: 'Mola sonlandirildi. Calismaniza devam edebilirsiniz.',
      seat: updatedSeat,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/break-report', (req, res) => {
  try {
    const { seatId, reporterStudentNumber } = req.body
    const result = store.reportBreak({ seatId, reporterStudentNumber })
    if (result.released) {
      broadcast('SEAT_UPDATED', result.seat)
    }
    broadcast('BREAK_REPORTS_SYNC', store.getBreakReports())
    res.json({
      success: true,
      message: result.released
        ? 'Mola suresi 20 dakikayi astigi icin masa serbest birakildi.'
        : 'Mola asimi bildirimi kaydedildi.',
      released: result.released,
      seat: result.seat,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/weekly-goal/:studentNumber', (req, res) => {
  const { studentNumber } = req.params
  res.json({ goalHours: store.getWeeklyGoal(studentNumber) })
})

app.post('/api/weekly-goal', (req, res) => {
  const { studentNumber, goalHours } = req.body
  const saved = store.setWeeklyGoal(studentNumber, goalHours)
  res.json({ goalHours: saved })
})

server.listen(PORT, () => {
  console.log(`KampusMasa backend server running on port ${PORT}`)
})
