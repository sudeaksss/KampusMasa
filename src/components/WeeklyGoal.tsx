import { Clock3 } from 'lucide-react'
import { formatElapsed } from '../lib/format'

type WeeklyGoalProps = {
  weeklyStudyDuration: number
  weeklyGoalHours: number
  weeklyGoalInput: string
  weeklyGoalProgress: number
  onGoalInputChange: (value: string) => void
  onSaveGoal: () => void
}

export function WeeklyGoal({ weeklyStudyDuration, weeklyGoalHours, weeklyGoalInput, weeklyGoalProgress, onGoalInputChange, onSaveGoal }: WeeklyGoalProps) {
  return (
    <section className="weekly-goal-strip" aria-label="Haftalık çalışma hedefi">
      <div className="weekly-goal-copy"><span className="recommendation-kicker"><Clock3 size={13} /> BU HAFTA</span><strong>Çalışma hedefin</strong><span>{formatElapsed(weeklyStudyDuration)} çalıştın</span></div>
      <div className="weekly-goal-progress"><div className="weekly-goal-progress-label"><span>{formatElapsed(weeklyStudyDuration)} / {weeklyGoalHours} sa</span><strong>%{weeklyGoalProgress}</strong></div><div className="weekly-goal-track" role="progressbar" aria-label="Haftalık çalışma hedefi ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weeklyGoalProgress}><span style={{ width: `${weeklyGoalProgress}%` }} /></div></div>
      <label className="weekly-goal-input"><span>Haftalık hedef</span><span><input type="number" min={1} max={80} step={1} value={weeklyGoalInput} aria-label="Haftalık çalışma hedefi, saat" onChange={(event) => onGoalInputChange(event.target.value)} onBlur={onSaveGoal} onKeyDown={(event) => { if (event.key === 'Enter') { onSaveGoal(); event.currentTarget.blur() } }} /> sa</span></label>
    </section>
  )
}
