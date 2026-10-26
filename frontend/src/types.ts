export type SeatStatus = 'available' | 'reserved' | 'occupied'
export type DashboardView = 'map' | 'leaderboard' | 'exams' | 'board' | 'ai'

export type NoteCategory = 'kayip' | 'bulundu' | 'yardim' | 'genel'

export interface NoteComment {
  id: string
  noteId: string
  studentNumber: string
  studentName: string
  content: string
  createdAt: number
}

export interface LibraryNote {
  id: string
  title: string
  content: string
  category: NoteCategory
  locationName: string
  seatCode?: string
  studentNumber: string
  studentName: string
  isResolved: boolean
  createdAt: number
  comments: NoteComment[]
}

export type ExamType = 'vize' | 'final' | 'butunleme' | 'quiz' | 'diger'

export type ExamItem = {
  id: string
  courseName: string
  type: ExamType
  customCategory?: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  classroom?: string
  notes?: string
  createdAt: number
}

export type FloorInfo = {
  floorNumber: number
  floorLabel: string
  sectionLabel: string
  mapTitle: string
  mapLabel: string
}

export type Location = {
  id: string
  name: string
  shortName: string
  sectionLabel: string
  floorLabel: string
  mapTitle: string
  mapLabel: string
  hours: string
  floors?: FloorInfo[]
  areaLabels: Record<string, string>
  tableLabels: Record<string, string>
}

export type Seat = {
  id: string
  code: string
  locationId: string
  floor?: number
  area: string
  table: string
  status: SeatStatus
  studentNumber: string | null
  expiresAt: number | null
  checkedInAt: number | null
  estimatedLeaveAt: string | null
  receiptCode: string | null
  breakStartedAt: number | null
  reservationGroupId?: string | null
  reservationGroupSize?: number | null
}

export type StudySession = {
  studentNumber: string
  seatId: string
  locationId: string
  area: string
  startedAt: number
  endedAt: number | null
}

export type BreakReport = {
  id: string
  seatId: string
  reporterStudentNumber: string
  breakStartedAt: number
  createdAt: number
}

export type LeaderboardRow = {
  studentNumber: string
  duration: number
  active: boolean
}
