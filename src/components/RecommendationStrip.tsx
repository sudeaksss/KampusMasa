import { ArrowRight, MapPin, Sparkles } from 'lucide-react'
import type { Seat } from '../types'

type Recommendation = {
  seat: Seat
  reason: string
}

type RecommendationStripProps = {
  recommendations: Recommendation[]
  hasPreference: boolean
  favoriteSeatId: string | null
  visits: number
  onSelectSeat: (seatId: string) => void
}

export function RecommendationStrip({ recommendations, hasPreference, favoriteSeatId, visits, onSelectSeat }: RecommendationStripProps) {
  return (
    <section className="recommendation-strip" aria-label="Sana özel masa önerileri">
      <div className="recommendation-heading"><span className="recommendation-kicker"><Sparkles size={13} /> SANA ÖZEL</span><strong>Bir sonraki masan</strong><span>{hasPreference ? `${visits} geçmiş oturumuna göre` : 'Tercihlerin oluştukça öneriler kişiselleşir.'}</span></div>
      {recommendations.length > 0 ? <div className="recommendation-list">
        {recommendations.map(({ seat, reason }) => <button className="recommendation-item" key={seat.id} type="button" onClick={() => onSelectSeat(seat.id)}>
          <span className="recommendation-seat"><MapPin size={14} /> {seat.code}</span>
          <span className="recommendation-reason">{seat.id === favoriteSeatId ? `Favori yerin ${seat.code} boş, oturabilirsin.` : reason}</span>
          <span className="recommendation-available"><i /> Şimdi boş</span>
          <ArrowRight className="recommendation-arrow" size={15} />
        </button>)}
      </div> : <div className="recommendation-empty">{hasPreference ? 'Tercih ettiğin alanlarda şu an boş masa yok.' : 'İlk masa oturumundan sonra sana uygun boş masaları burada göstereceğim.'}</div>}
    </section>
  )
}
