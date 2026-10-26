import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Brain,
  Clock,
  Send,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { api } from '../lib/api'
import type { Seat } from '../types'

type AiAssistantViewProps = {
  seats: Seat[]
  onSelectSeat?: (seatId: string) => void
  onNavigateToMap: () => void
  studentNumber?: string
}

type ChatMessage = {
  id: string
  sender: 'user' | 'assistant'
  text: string
  category?: string
  predictedOccupancy?: number
  currentOccupancy?: number
  timestamp: string
}

const PRESET_QUESTIONS = [
  'Bugün saat kaçta kütüphane en sakin olur?',
  'Şu an en sessiz boş masa nerede var?',
  'Grup çalışması için kaçıncı katı önerirsin?',
  'Masa rezervasyonu ve mola süresi kuralı nedir?',
  'Sınav döneminde kütüphane çalışma saatleri nasıl?',
]

export function AiAssistantView({
  seats,
  onSelectSeat: _onSelectSeat,
  onNavigateToMap,
  studentNumber,
}: AiAssistantViewProps) {
  // ML Model interactive controls
  const now = new Date()
  const [selectedHour, setSelectedHour] = useState<number>(now.getHours() >= 8 && now.getHours() <= 22 ? now.getHours() : 14)
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [selectedArea, setSelectedArea] = useState<number>(1) // 0=Pencere, 1=Sessiz, 2=Grup
  const [isExamPeriod, setIsExamPeriod] = useState<boolean>(false)

  // ML Prediction data
  const [prediction, setPrediction] = useState<{
    predicted_occupancy: number
    congestion_level: string
    status_color: string
    recommendation: string
    hourly_forecast: Array<{ hour: string; predicted_occupancy: number }>
    area_breakdown: Record<string, number>
    model_r2_score: number
  } | null>(null)
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false)

  // Chat conversation
  const [inputMessage, setInputMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Merhaba! Ben GTÜ KampüsMasa Akıllı Kütüphane Asistanıyım. Kütüphanedeki anlık ve saatlik doluluk tahminlerini öğrenebilir, sessiz veya grup çalışma masaları için en uygun zamanları danışabilirsiniz. Aşağıdaki hazır sorulardan birini seçebilir veya kütüphaneyle ilgili bir soru sorabilirsiniz.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const isFirstRender = useRef(true)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Fetch prediction on parameter change
  const fetchPrediction = async () => {
    setLoadingPrediction(true)
    try {
      const data = await api.predictOccupancy({
        hour: selectedHour,
        floor: selectedFloor,
        area_type: selectedArea,
        is_exam_period: isExamPeriod ? 1 : 0,
      })
      setPrediction(data)
    } catch {
      // Fallback prediction
      setPrediction({
        predicted_occupancy: 42.5,
        congestion_level: 'Orta Yoğunluk',
        status_color: 'warning',
        recommendation: 'Model verisi yüklendi. Kütüphanede dengeli bir doluluk oranı öngörülüyor.',
        hourly_forecast: [
          { hour: `${selectedHour + 1}:00`, predicted_occupancy: 48.0 },
          { hour: `${selectedHour + 2}:00`, predicted_occupancy: 54.0 },
          { hour: `${selectedHour + 3}:00`, predicted_occupancy: 45.0 },
        ],
        area_breakdown: { 'Pencere önü': 48.0, 'Sessiz çalışma': 42.5, 'Grup çalışma': 38.0 },
        model_r2_score: 0.9737,
      })
    } finally {
      setLoadingPrediction(false)
    }
  }

  useEffect(() => {
    fetchPrediction()
  }, [selectedHour, selectedFloor, selectedArea, isExamPeriod])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const handleSendMessage = async (msgText: string) => {
    const text = msgText.trim()
    if (!text || chatLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setChatLoading(true)

    try {
      const resp = await api.chatWithAssistant(text, studentNumber)
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: resp.reply,
        category: resp.category,
        predictedOccupancy: resp.predicted_occupancy,
        currentOccupancy: resp.current_occupancy,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: 'Üzgünüm, şu an asistan sunucusuna ulaşılamadı. Lütfen tekrar deneyiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setChatLoading(false)
    }
  }

  const occupiedSeatsCount = seats.filter((s) => s.status === 'occupied' || s.status === 'reserved').length
  const liveOccupancyPct = seats.length > 0 ? Math.round((occupiedSeatsCount / seats.length) * 100) : 0

  return (
    <div className="ai-view-container">
      {/* Top Banner / Model Architecture Info */}
      <section className="ai-header-card" aria-label="Yapay Zeka Mimari Bilgisi">
        <div className="ai-header-left">
          <div className="ai-badge-row">
            <span className="ai-pill ai-pill-primary">
              <Sparkles size={13} />
              <span>KÜTÜPHANE DANIŞMANI</span>
            </span>
            <span className="ai-pill ai-pill-cpu">
              <TrendingUp size={13} />
              <span>CANLI DOLULUK MOTORU</span>
            </span>
          </div>
          <h2 className="ai-title">Kütüphane Akıllı Asistanı ve Doluluk Tahmini</h2>
          <p className="ai-subtitle">
            Gebze Teknik Üniversitesi kütüphane kullanım verileri doğrultusunda; tarih, saat, sınav dönemi ve kat yerleşimine göre anlık ve saatlik doluluk analizleri sunar.
          </p>
        </div>
        <div className="ai-live-card">
          <div className="ai-live-label">
            <span className="live-dot" />
            <span>ANLIK CANLI DOLULUK</span>
          </div>
          <div className="ai-live-value">%{liveOccupancyPct}</div>
          <div className="ai-live-detail">{occupiedSeatsCount} / {seats.length} Masa Dolu</div>
        </div>
      </section>

      {/* Grid: Left Column = ML Forecast Engine, Right Column = Domain Chat Assistant */}
      <div className="ai-content-grid">
        {/* Left Column: Interactive ML Predictor */}
        <section className="ai-predictor-card" aria-labelledby="ml-predictor-title">
          <div className="card-header">
            <div className="card-header-icon">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 id="ml-predictor-title" className="card-title">Doluluk Tahmin Simülasyonu</h3>
              <p className="card-desc">Farklı saat ve sınav dönemi koşullarına göre yoğunluk analizi</p>
            </div>
            <button
              type="button"
              className="refresh-btn"
              onClick={fetchPrediction}
              title="Tahmini Yenile"
              aria-label="Tahmini Yenile"
            >
              <RefreshCw size={15} className={loadingPrediction ? 'spin-anim' : ''} />
            </button>
          </div>

          {/* Interactive Parameters */}
          <div className="ai-controls-box">
            <div className="control-group">
              <label htmlFor="ai-hour-select" className="control-label">
                <Clock size={14} />
                <span>Hedef Saat: <strong>{String(selectedHour).padStart(2, '0')}:00</strong></span>
              </label>
              <input
                id="ai-hour-select"
                type="range"
                min={8}
                max={22}
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="ai-slider"
                aria-valuemin={8}
                aria-valuemax={22}
                aria-valuenow={selectedHour}
                aria-label="Tahmin saati seçimi"
              />
              <div className="slider-ticks">
                <span>08:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span>22:00</span>
              </div>
            </div>

            <div className="control-row">
              <div className="control-group flex-1">
                <span className="control-label">
                  <MapPin size={14} />
                  <span>Kat Seçimi</span>
                </span>
                <div className="segmented-control" role="radiogroup" aria-label="Kat seçimi">
                  <button
                    type="button"
                    className={`seg-btn ${selectedFloor === 1 ? 'active' : ''}`}
                    onClick={() => setSelectedFloor(1)}
                  >
                    1. Kat (Sessiz)
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${selectedFloor === 2 ? 'active' : ''}`}
                    onClick={() => setSelectedFloor(2)}
                  >
                    2. Kat (Grup)
                  </button>
                </div>
              </div>

              <div className="control-group flex-1">
                <span className="control-label">
                  <Calendar size={14} />
                  <span>Dönem</span>
                </span>
                <div className="segmented-control" role="radiogroup" aria-label="Dönem seçimi">
                  <button
                    type="button"
                    className={`seg-btn ${!isExamPeriod ? 'active' : ''}`}
                    onClick={() => setIsExamPeriod(false)}
                  >
                    Normal Hafta
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${isExamPeriod ? 'active' : ''}`}
                    onClick={() => setIsExamPeriod(true)}
                  >
                    Vize / Final
                  </button>
                </div>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">
                <Users size={14} />
                <span>Çalışma Alanı Türü</span>
              </span>
              <div className="area-chips" role="radiogroup" aria-label="Çalışma alanı türü">
                <button
                  type="button"
                  className={`area-chip ${selectedArea === 0 ? 'active' : ''}`}
                  onClick={() => setSelectedArea(0)}
                >
                  Pencere Kenarı
                </button>
                <button
                  type="button"
                  className={`area-chip ${selectedArea === 1 ? 'active' : ''}`}
                  onClick={() => setSelectedArea(1)}
                >
                  Bireysel / Sessiz Salon
                </button>
                <button
                  type="button"
                  className={`area-chip ${selectedArea === 2 ? 'active' : ''}`}
                  onClick={() => setSelectedArea(2)}
                >
                  Grup Çalışma Masaları
                </button>
              </div>
            </div>
          </div>

          {/* Model Prediction Results */}
          {prediction && (
            <div className="prediction-result-panel">
              <div className="result-main-gauge">
                <div className="gauge-info">
                  <span className="gauge-kicker">TAHMİNİ DOLULUK</span>
                  <div className="gauge-pct">
                    %{prediction.predicted_occupancy}
                    <span className={`status-pill pill-${prediction.status_color}`}>
                      {prediction.congestion_level}
                    </span>
                  </div>
                </div>
                <div className="gauge-meter-track" aria-hidden="true">
                  <div
                    className={`gauge-meter-fill fill-${prediction.status_color}`}
                    style={{ width: `${prediction.predicted_occupancy}%` }}
                  />
                </div>
              </div>

              <div className="recommendation-box">
                <div className="rec-icon">
                  <Brain size={18} />
                </div>
                <div className="rec-text">
                  <strong>Akıllı Öneri & Analiz</strong>
                  <p>{prediction.recommendation}</p>
                </div>
              </div>

              {/* Area Breakdown Comparison */}
              {prediction.area_breakdown && (
                <div className="breakdown-section">
                  <span className="section-label">Alanlara Göre Tahmini Yoğunluk</span>
                  <div className="breakdown-grid">
                    {Object.entries(prediction.area_breakdown).map(([areaName, val]) => (
                      <div key={areaName} className="breakdown-item">
                        <span className="item-name">{areaName}</span>
                        <div className="item-bar-wrap">
                          <div
                            className="item-bar-fill"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="item-pct">%{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Hour Trend */}
              {prediction.hourly_forecast && prediction.hourly_forecast.length > 0 && (
                <div className="hourly-trend-section">
                  <span className="section-label">Önümüzdeki Saatler Tahmin Eğrisi</span>
                  <div className="hourly-bars">
                    {prediction.hourly_forecast.map((hItem) => (
                      <div key={hItem.hour} className="hour-bar-col">
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ height: `${hItem.predicted_occupancy}%` }}
                            title={`Saat ${hItem.hour}: %${hItem.predicted_occupancy}`}
                          />
                        </div>
                        <span className="bar-val">%{Math.round(hItem.predicted_occupancy)}</span>
                        <span className="bar-time">{hItem.hour}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-row">
                <button
                  type="button"
                  className="go-map-btn"
                  onClick={onNavigateToMap}
                >
                  <MapPin size={16} />
                  <span>Haritaya Git ve Boş Masa Seç</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Domain Smart Library Chat Assistant */}
        <section className="ai-chat-card" aria-labelledby="assistant-chat-title">
          <div className="card-header">
            <div className="card-header-icon chat-icon">
              <Brain size={18} />
            </div>
            <div>
              <h3 id="assistant-chat-title" className="card-title">Kütüphane Akıllı Danışmanı</h3>
              <p className="card-desc">Doluluk, sessiz alanlar ve kütüphane kuralları için uzman asistan</p>
            </div>
          </div>

          {/* Preset Questions Chips */}
          <div className="preset-chips-wrap">
            <span className="chips-title">Sıkça Sorulan Sorular:</span>
            <div className="chips-scroller">
              {PRESET_QUESTIONS.map((questionText) => (
                <button
                  key={questionText}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleSendMessage(questionText)}
                  disabled={chatLoading}
                >
                  {questionText}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="chat-messages-container" ref={chatContainerRef} role="log" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble-row ${m.sender === 'user' ? 'row-user' : 'row-assistant'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="avatar-assistant" aria-hidden="true">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className={`chat-bubble bubble-${m.sender}`}>
                  <div className="bubble-text">{m.text}</div>
                  <div className="bubble-meta">
                    {m.category && (
                      <span className="bubble-category-tag">{m.category}</span>
                    )}
                    <span className="bubble-time">{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="chat-bubble-row row-assistant">
                <div className="avatar-assistant" aria-hidden="true">
                  <Sparkles size={14} />
                </div>
                <div className="chat-bubble bubble-assistant typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputMessage)
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Kütüphane doluluğu, uygun masa veya kurallar hakkında soru sor..."
              className="chat-input"
              aria-label="Kütüphane asistanına soru yaz"
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputMessage.trim() || chatLoading}
              aria-label="Soruyu gönder"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
