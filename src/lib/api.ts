import type { BreakReport, Seat, StudySession } from '../types'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

type WebSocketPayload = {
  type: string
  payload: unknown
  timestamp: number
}

type EventListener = (data: any) => void

class ApiClient {
  private ws: WebSocket | null = null
  private listeners: Map<string, Set<EventListener>> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.connectWebSocket()
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  private setConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.emit('connectionStatus', status)
    }
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return

    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // Ignore close errors
      }
    }

    this.setConnectionStatus('connecting')

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Connect to same host via Vite proxy (/ws) or fallback to port 3001
    const wsUrl = `${protocol}//${window.location.host}/ws`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.setConnectionStatus('connected')
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }

        if (this.pingInterval) clearInterval(this.pingInterval)
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PING' }))
          }
        }, 15000)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketPayload
          if (data && data.type) {
            this.emit(data.type, data.payload)
          }
        } catch {
          // Ignore parse errors
        }
      }

      this.ws.onclose = () => {
        this.setConnectionStatus('disconnected')
        if (this.pingInterval) clearInterval(this.pingInterval)
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.setConnectionStatus('disconnected')
      }
    } catch {
      this.setConnectionStatus('disconnected')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connectWebSocket()
    }, 3000)
  }

  public on(event: string, callback: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(data)
        } catch (err) {
          console.error('Error in event listener:', err)
        }
      })
    }
  }

  // REST API Methods
  async fetchBootstrap(): Promise<{
    seats: Seat[]
    studySessions: StudySession[]
    breakReports: BreakReport[]
    studentNumbers?: string[]
  }> {
    const res = await fetch('/api/bootstrap')
    if (!res.ok) {
      throw new Error(`Bootstrap istegi basarisiz: ${res.statusText}`)
    }
    return res.json()
  }

  async reserveSeat(params: {
    seatId: string
    studentNumber: string
    groupSize?: number
  }): Promise<{ success: boolean; seat: Seat; message: string }> {
    const res = await fetch('/api/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Masa rezerve edilemedi.')
    }
    return data
  }

  async checkInSeat(params: {
    seatId: string
    studentNumber?: string
    receiptCode?: string
  }): Promise<{ success: boolean; seat: Seat; message: string }> {
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Giris basarisiz oldu.')
    }
    return data
  }

  async releaseSeat(params: {
    seatId: string
    studentNumber: string
  }): Promise<{ success: boolean; seat: Seat; message: string }> {
    const res = await fetch('/api/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Masa bosaltilamadi.')
    }
    return data
  }

  async startBreak(params: {
    seatId: string
    studentNumber: string
  }): Promise<{ success: boolean; seat: Seat; message: string }> {
    const res = await fetch('/api/break/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Mola baslatilamadi.')
    }
    return data
  }

  async endBreak(params: {
    seatId: string
    studentNumber: string
  }): Promise<{ success: boolean; seat: Seat; message: string }> {
    const res = await fetch('/api/break/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Mola sonlandirilamadi.')
    }
    return data
  }

  async reportBreak(params: {
    seatId: string
    reporterStudentNumber: string
  }): Promise<{ success: boolean; released: boolean; message: string; seat?: Seat }> {
    const res = await fetch('/api/break-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Mola bildirimi iletilemedi.')
    }
    return data
  }

  async fetchWeeklyGoal(studentNumber: string): Promise<number> {
    if (!studentNumber) return 8
    try {
      const res = await fetch(`/api/weekly-goal/${encodeURIComponent(studentNumber)}`)
      if (res.ok) {
        const data = await res.json()
        return Number(data.goalHours) || 8
      }
    } catch {
      // Fallback
    }
    return 8
  }

  async saveWeeklyGoal(studentNumber: string, goalHours: number): Promise<void> {
    if (!studentNumber) return
    try {
      await fetch('/api/weekly-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNumber, goalHours }),
      })
    } catch {
      // Ignore network errors
    }
  }

  async login(studentNo: string, password: string): Promise<{
    success: boolean
    studentNo: string
    firstName?: string
    lastName?: string
    fullName?: string
    message: string
  }> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentNo, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Giriş başarısız oldu.')
    }
    return data
  }

  async predictOccupancy(params?: {
    day_of_week?: number
    hour?: number
    is_exam_period?: number
    floor?: number
    area_type?: number
  }): Promise<{
    day_of_week: number
    hour: number
    floor: number
    is_exam_period: boolean
    predicted_occupancy: number
    congestion_level: string
    status_color: string
    recommendation: string
    hourly_forecast: Array<{ hour: string; predicted_occupancy: number }>
    area_breakdown: Record<string, number>
    model_r2_score: number
  }> {
    const res = await fetch('/api/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    })
    if (!res.ok) {
      throw new Error('Doluluk tahmini alınamadı.')
    }
    return res.json()
  }

  async chatWithAssistant(message: string, studentNumber?: string): Promise<{
    reply: string
    category: string
    predicted_occupancy?: number
    current_occupancy?: number
    target_hour?: number
    available_count?: number
    available_group_seats?: number
  }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, student_number: studentNumber }),
    })
    if (!res.ok) {
      throw new Error('Asistan yanıt veremedi.')
    }
    return res.json()
  }
}

export const api = new ApiClient()
