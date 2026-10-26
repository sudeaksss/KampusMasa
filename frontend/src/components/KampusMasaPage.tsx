import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import {
  Armchair,
  ArrowDownRight,
  ArrowRight,
  Brain,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  DoorOpen,
  FileDown,
  GraduationCap,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Megaphone,
  Medal,
  MapPin,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  Printer,
  ReceiptText,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  Trophy,
  UsersRound,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import '../App.css'
import { api, type ConnectionStatus } from '../lib/api'
import { createInitialStudySessions, getStudentFullName, getStudentInitials } from '../data/students'
import { createInitialNotes } from '../data/mockNotes'
import { AiAssistantView } from './AiAssistantView'

import type {
  BreakReport,
  DashboardView,
  ExamItem,
  ExamType,
  LibraryNote,
  NoteCategory,
  NoteComment,
  Seat,
  SeatStatus,
  StudySession,
} from '../types'

const SEAT_STORAGE_KEY = 'kampus-masa-seats-v1'
const STUDY_SESSION_STORAGE_KEY = 'kampus-masa-study-sessions-v1'
const STUDENT_STORAGE_KEY = 'kampus-masa-student-v1'
const WEEKLY_GOAL_STORAGE_PREFIX = 'kampus-masa-weekly-goal-v1:'
const BREAK_REPORT_STORAGE_KEY = 'kampus-masa-break-reports-v1'
const BREAK_REPORT_THRESHOLD = 20 * 60_000
const EXAMS_STORAGE_KEY = 'kampus-masa-exams-v1'
const NOTE_STORAGE_KEY = 'kampus-masa-notes-v1'


import { locations, CENTRAL_LOCATION_ID, createInitialSeats } from '../data/locations'

function createInitialExams(): ExamItem[] {
  const today = new Date()
  const addDays = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return [
    {
      id: 'exam-turkce-vize',
      courseName: 'Türkçe',
      type: 'vize',
      date: addDays(14),
      time: '10:30',
      classroom: 'Amfi 1',
      notes: 'Dilbilgisi ve Anlatım Bozuklukları',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'exam-matematik-vize',
      courseName: 'Matematik I',
      type: 'vize',
      date: addDays(18),
      time: '14:00',
      classroom: 'Derslik B-204',
      notes: 'Türev ve İntegral Giriş',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'exam-fizik-final',
      courseName: 'Genel Fizik I',
      type: 'final',
      date: addDays(42),
      time: '11:00',
      classroom: 'Merkez Kütüphane Konferans Salonu',
      notes: 'Tüm dönem konuları dahil',
      createdAt: Date.now() - 10800000,
    },
    {
      id: 'exam-proje-teslim',
      courseName: 'Yazılım Mühendisliği',
      type: 'diger',
      date: addDays(24),
      time: '23:59',
      classroom: 'Öğrenci Portalı Teslimi',
      notes: 'Dönem Sonu Projesi & Sunum Dosyası',
      createdAt: Date.now() - 5400000,
    },
  ]
}

function formatExamTypeLabel(type: ExamType, customCategory?: string): string {
  if (type === 'diger') {
    return customCategory?.trim() ? customCategory.trim().toLocaleUpperCase('tr-TR') : 'DİĞER'
  }
  switch (type) {
    case 'vize': return 'VİZE'
    case 'final': return 'FİNAL'
    case 'butunleme': return 'BÜTÜNLEME'
    case 'quiz': return 'QUİZ'
    default: return 'DİĞER'
  }
}

function readExams(): ExamItem[] {
  try {
    const stored = localStorage.getItem(EXAMS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ExamItem[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    localStorage.removeItem(EXAMS_STORAGE_KEY)
  }
  return createInitialExams()
}

function formatExamFullDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })
    }
    return dateStr
  } catch {
    return dateStr
  }
}

function getExamRemaining(dateStr: string, timeStr: string, currentTime: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
  text: string
  isPast: boolean
} {
  try {
    const target = new Date(`${dateStr}T${timeStr}:00`).getTime()
    if (isNaN(target)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, text: 'Tarih geçersiz', isPast: false }
    }
    const diff = target - currentTime
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, text: 'Sınav zamanı geldi / tamamlandı', isPast: true }
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    let text = ''
    if (days > 0) {
      text = `${days} gün ${hours} saat kaldı`
    } else if (hours > 0) {
      text = `${hours} saat ${minutes} dakika kaldı`
    } else if (minutes > 0) {
      text = `${minutes} dakika ${seconds} saniye kaldı`
    } else {
      text = `${seconds} saniye kaldı`
    }
    return { days, hours, minutes, seconds, text, isPast: false }
  } catch {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, text: '—', isPast: false }
  }
}

function readSeats(): Seat[] {
  try {
    const stored = localStorage.getItem(SEAT_STORAGE_KEY)
    if (stored) {
      const savedSeats = JSON.parse(stored) as Seat[]
      if (
        Array.isArray(savedSeats) &&
        savedSeats.length >= 80 &&
        !savedSeats.some((s) => s.studentNumber && s.studentNumber.startsWith('2024')) &&
        savedSeats.some((s) => s.locationId === CENTRAL_LOCATION_ID && s.floor === 1) &&
        savedSeats.some((s) => s.locationId === CENTRAL_LOCATION_ID && s.floor === 2)
      ) {
        return savedSeats
      }
    }
  } catch {
    localStorage.removeItem(SEAT_STORAGE_KEY)
  }
  return createInitialSeats()
}

function readStudySessions(): StudySession[] {
  try {
    const stored = localStorage.getItem(STUDY_SESSION_STORAGE_KEY)
    if (!stored) return createInitialStudySessions()
    const sessions = JSON.parse(stored) as StudySession[]
    if (
      !Array.isArray(sessions) ||
      sessions.length < 5 ||
      sessions.some((s) => s.studentNumber && s.studentNumber.startsWith('2024'))
    ) {
      localStorage.removeItem(STUDY_SESSION_STORAGE_KEY)
      return createInitialStudySessions()
    }
    return sessions.map((session) => {
      const locationId = session.locationId ?? CENTRAL_LOCATION_ID
      const seatCode = session.seatId ?? ''
      return {
        ...session,
        seatId: session.locationId || !seatCode || seatCode.includes(':') ? seatCode : `${locationId}:${seatCode}`,
        locationId,
        area: session.area ?? '',
      }
    })
  } catch {
    localStorage.removeItem(STUDY_SESSION_STORAGE_KEY)
    return createInitialStudySessions()
  }
}

function readBreakReports(): BreakReport[] {
  try {
    const stored = localStorage.getItem(BREAK_REPORT_STORAGE_KEY)
    if (!stored) return []
    const reports = JSON.parse(stored) as BreakReport[]
    return Array.isArray(reports) ? reports : []
  } catch {
    localStorage.removeItem(BREAK_REPORT_STORAGE_KEY)
    return []
  }
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatClock(timestamp: number | null) {
  if (!timestamp) return '—'
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

function formatDuration(startedAt: number | null, currentTime: number) {
  if (!startedAt) return '—'
  return formatElapsed(currentTime - startedAt)
}

function formatElapsed(milliseconds: number) {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours === 0) return `${minutes} dk`
  return remainingMinutes === 0 ? `${hours} sa` : `${hours} sa ${remainingMinutes} dk`
}

function formatStudentAlias(studentNumber: string) {
  return getStudentFullName(studentNumber)
}

function isValidClockTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function formatNoteCategoryLabel(category: NoteCategory): string {
  switch (category) {
    case 'kayip': return 'Kayıp Eşya'
    case 'bulundu': return 'Bulunan Eşya'
    case 'yardim': return 'Ders & Yardım'
    case 'genel': return 'Genel Duyuru'
    default: return 'Genel'
  }
}

function formatTimeAgo(timestamp: number, currentNow: number): string {
  const diff = Math.max(0, currentNow - timestamp)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Az önce'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

function readNotes(): LibraryNote[] {
  try {
    const stored = localStorage.getItem(NOTE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as LibraryNote[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    localStorage.removeItem(NOTE_STORAGE_KEY)
  }
  return createInitialNotes()
}

function KampusMasaPage() {
  const [seats, setSeats] = useState<Seat[]>(readSeats)
  const [studySessions, setStudySessions] = useState<StudySession[]>(readStudySessions)
  const [breakReports, setBreakReports] = useState<BreakReport[]>(readBreakReports)
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>(() => api.getConnectionStatus())
  const [studentNumber, setStudentNumber] = useState(() => localStorage.getItem(STUDENT_STORAGE_KEY) ?? '')
  const [studentFullName, setStudentFullName] = useState(() => localStorage.getItem('kampus-masa-student-name-v1') ?? '')
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(() => {
    const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY) ?? ''
    return Number(localStorage.getItem(`${WEEKLY_GOAL_STORAGE_PREFIX}${savedStudent}`)) || 8
  })
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(() => String(weeklyGoalHours))
  const [groupSeatCount, setGroupSeatCount] = useState(2)
  const [selectedGroupSeatIds, setSelectedGroupSeatIds] = useState<string[]>([])
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kampus-masa-theme-v1') === 'dark')
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'leaderboard' || hash === 'exams' || hash === 'board' || hash === 'map' || hash === 'ai') {
        return hash as DashboardView
      }
      const saved = localStorage.getItem('kampus-masa-active-view-v1')
      if (saved === 'leaderboard' || saved === 'exams' || saved === 'board' || saved === 'map' || saved === 'ai') {
        return saved as DashboardView
      }
    }
    return 'map'
  })
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [selectedLocationId, setSelectedLocationId] = useState(CENTRAL_LOCATION_ID)
  const [selectedSeatId, setSelectedSeatId] = useState(`${CENTRAL_LOCATION_ID}:1:P-03`)
  const [activeArea, setActiveArea] = useState('Tüm alanlar')
  const [searchQuery, setSearchQuery] = useState('')
  const [now, setNow] = useState(Date.now())
  const [estimatedLeaveAt, setEstimatedLeaveAt] = useState('')
  const [estimateError, setEstimateError] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginValue, setLoginValue] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [pendingAction, setPendingAction] = useState<'reserve' | 'walk-in' | 'report-break' | 'group-reserve' | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<'reservation' | 'walk-in' | null>(null)
  const [scannerMessage, setScannerMessage] = useState('')
  const [receiptSeatId, setReceiptSeatId] = useState<string | null>(null)
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null)
  const [receiptPdfError, setReceiptPdfError] = useState('')
  const [notice, setNotice] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)

  const [exams, setExams] = useState<ExamItem[]>(readExams)
  const [examFilter, setExamFilter] = useState<'all' | 'vize' | 'final' | 'diger'>('all')
  const [addExamModalOpen, setAddExamModalOpen] = useState(false)
  const [examCourseInput, setExamCourseInput] = useState('')
  const [examTypeInput, setExamTypeInput] = useState<ExamType>('vize')
  const [examCustomCategoryInput, setExamCustomCategoryInput] = useState('')
  const [examDateInput, setExamDateInput] = useState('')
  const [examTimeInput, setExamTimeInput] = useState('10:00')
  const [examClassroomInput, setExamClassroomInput] = useState('')
  const [examNotesInput, setExamNotesInput] = useState('')
  const [examError, setExamError] = useState('')

  useEffect(() => {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams))
  }, [exams])

  const sortedUpcomingExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const target = new Date(`${exam.date}T${exam.time}:00`).getTime()
        return !isNaN(target) && target > now
      })
      .sort((a, b) => {
        const tA = new Date(`${a.date}T${a.time}:00`).getTime()
        const tB = new Date(`${b.date}T${b.time}:00`).getTime()
        return tA - tB
      })
  }, [exams, now])

  const nearestUpcomingExam = sortedUpcomingExams[0] ?? null

  const countdownData = useMemo(() => {
    if (!nearestUpcomingExam) return { days: '00', hours: '00', minutes: '00', seconds: '00' }
    const rem = getExamRemaining(nearestUpcomingExam.date, nearestUpcomingExam.time, now)
    return {
      days: String(rem.days).padStart(2, '0'),
      hours: String(rem.hours).padStart(2, '0'),
      minutes: String(rem.minutes).padStart(2, '0'),
      seconds: String(rem.seconds).padStart(2, '0'),
    }
  }, [nearestUpcomingExam, now])

  const filteredExams = useMemo(() => {
    let list = [...exams]
    if (examFilter === 'diger') {
      list = list.filter((e) => e.type === 'diger' || e.type === 'butunleme' || e.type === 'quiz')
    } else if (examFilter !== 'all') {
      list = list.filter((e) => e.type === examFilter)
    }
    return list.sort((a, b) => {
      const tA = new Date(`${a.date}T${a.time}:00`).getTime()
      const tB = new Date(`${b.date}T${b.time}:00`).getTime()
      return tA - tB
    })
  }, [exams, examFilter])

  const handleSaveExam = (event: React.FormEvent) => {
    event.preventDefault()
    if (!examCourseInput.trim()) {
      setExamError('Lütfen ders adını girin.')
      return
    }
    if (!examDateInput) {
      setExamError('Lütfen sınav tarihini seçin.')
      return
    }
    if (!examTimeInput) {
      setExamError('Lütfen sınav saatini girin.')
      return
    }

    const newExam: ExamItem = {
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      courseName: examCourseInput.trim(),
      type: examTypeInput,
      customCategory: examTypeInput === 'diger' && examCustomCategoryInput.trim() ? examCustomCategoryInput.trim() : undefined,
      date: examDateInput,
      time: examTimeInput,
      classroom: examClassroomInput.trim() || undefined,
      notes: examNotesInput.trim() || undefined,
      createdAt: Date.now(),
    }

    setExams((prev) => [newExam, ...prev])
    setAddExamModalOpen(false)
    setNotice(`${newExam.courseName} (${newExam.type.toLocaleUpperCase('tr-TR')}) sınav takvimine eklendi.`)
  }

  const handleDeleteExam = (id: string) => {
    const target = exams.find((e) => e.id === id)
    setExams((prev) => prev.filter((e) => e.id !== id))
    setNotice(`${target?.courseName ?? 'Sınav'} takvimden silindi.`)
  }

  const [notes, setNotes] = useState<LibraryNote[]>(readNotes)
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<'all' | NoteCategory>('all')
  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false)
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('kayip')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteLocation, setNewNoteLocation] = useState('')
  const [newNoteSeatCode, setNewNoteSeatCode] = useState('')
  const [newNoteError, setNewNoteError] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const filteredNotes = useMemo(() => {
    let list = [...notes]
    if (noteCategoryFilter !== 'all') {
      list = list.filter((n) => n.category === noteCategoryFilter)
    }
    const q = noteSearchQuery.trim().toLocaleLowerCase('tr-TR')
    if (q) {
      list = list.filter((n) =>
        n.title.toLocaleLowerCase('tr-TR').includes(q) ||
        n.content.toLocaleLowerCase('tr-TR').includes(q) ||
        (n.seatCode && n.seatCode.toLocaleLowerCase('tr-TR').includes(q)) ||
        n.locationName.toLocaleLowerCase('tr-TR').includes(q) ||
        n.studentName.toLocaleLowerCase('tr-TR').includes(q) ||
        n.comments.some((c) => c.content.toLocaleLowerCase('tr-TR').includes(q) || c.studentName.toLocaleLowerCase('tr-TR').includes(q))
      )
    }
    return list.sort((a, b) => b.createdAt - a.createdAt)
  }, [notes, noteCategoryFilter, noteSearchQuery])

  const handleSaveNote = (event: React.FormEvent) => {
    event.preventDefault()
    if (!studentNumber) {
      setLoginValue('')
      setLoginError('Kütüphane panosuna not bırakmak için lütfen öğrenci girişi yapın.')
      setLoginOpen(true)
      return
    }
    if (!newNoteTitle.trim()) {
      setNewNoteError('Lütfen not başlığı girin.')
      return
    }
    if (!newNoteContent.trim()) {
      setNewNoteError('Lütfen açıklama / mesaj detayını girin.')
      return
    }

    const newNote: LibraryNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory,
      locationName: newNoteLocation.trim() || `${selectedLocation.name} · ${currentFloorLabel}`,
      seatCode: newNoteSeatCode.trim() ? newNoteSeatCode.trim().toLocaleUpperCase('tr-TR') : undefined,
      studentNumber,
      studentName: studentFullName || getStudentFullName(studentNumber),
      isResolved: false,
      createdAt: Date.now(),
      comments: [],
    }

    setNotes((prev) => [newNote, ...prev])
    setAddNoteModalOpen(false)
    setNewNoteTitle('')
    setNewNoteContent('')
    setNewNoteLocation('')
    setNewNoteSeatCode('')
    setNewNoteError('')
    setNotice('Notunuz kütüphane panosuna başarıyla eklendi.')
  }

  const handleToggleResolved = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const next = !n.isResolved
          setNotice(next ? 'Not çözüldü olarak işaretlendi.' : 'Not yeniden aktife alındı.')
          return { ...n, isResolved: next }
        }
        return n
      })
    )
  }

  const handleDeleteNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId)
    if (target && studentNumber && target.studentNumber !== studentNumber) {
      setNotice('Yalnızca kendi notunuzu silebilirsiniz.')
      return
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    setNotice('Not panodan kaldırıldı.')
  }

  const handleDeleteComment = (noteId: string, commentId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const targetComment = n.comments.find((c) => c.id === commentId)
          if (targetComment && studentNumber && targetComment.studentNumber !== studentNumber) {
            setNotice('Yalnızca kendi yorumunuzu silebilirsiniz.')
            return n
          }
          return {
            ...n,
            comments: n.comments.filter((c) => c.id !== commentId),
          }
        }
        return n
      })
    )
    setNotice('Yorumunuz silindi.')
  }

  const handleAddComment = (noteId: string) => {
    const text = (commentInputs[noteId] || '').trim()
    if (!text) return

    if (!studentNumber) {
      setLoginValue('')
      setLoginError('Yorum yazabilmek için lütfen öğrenci girişi yapın.')
      setLoginOpen(true)
      return
    }

    const newComment: NoteComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      noteId,
      studentNumber,
      studentName: studentFullName || getStudentFullName(studentNumber),
      content: text,
      createdAt: Date.now(),
    }

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          return { ...n, comments: [...n.comments, newComment] }
        }
        return n
      })
    )

    setCommentInputs((prev) => ({ ...prev, [noteId]: '' }))
    setNotice('Yorumunuz notun altına eklendi.')
  }

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? locations[0]
  const activeFloorInfo = selectedLocation.floors?.find((f) => f.floorNumber === selectedFloor) ?? selectedLocation.floors?.[0]
  const currentFloorLabel = activeFloorInfo ? activeFloorInfo.floorLabel : selectedLocation.floorLabel
  const currentSectionLabel = activeFloorInfo ? activeFloorInfo.sectionLabel : selectedLocation.sectionLabel
  const currentMapTitle = activeFloorInfo ? activeFloorInfo.mapTitle : selectedLocation.mapTitle
  const currentMapLabel = activeFloorInfo ? activeFloorInfo.mapLabel : selectedLocation.mapLabel

  const floorBadge = currentFloorLabel.match(/\d+/)?.[0].padStart(2, '0') ?? 'Z'
  const locationSeats = useMemo(() => {
    return seats.filter((seat) => {
      if (seat.locationId !== selectedLocationId) return false
      if (selectedLocation.floors && selectedLocation.floors.length > 0) {
        return seat.floor === selectedFloor
      }
      return true
    })
  }, [seats, selectedLocationId, selectedFloor, selectedLocation])
  const locationAreas = useMemo(() => ['Tüm alanlar', ...new Set(locationSeats.map((seat) => seat.area))], [locationSeats])
  const selectedSeat = seats.find((seat) => seat.id === selectedSeatId) ?? locationSeats[0]
  const receiptSeat = seats.find((seat) => seat.id === receiptSeatId) ?? null
  const selectedBreakReported = Boolean(studentNumber && selectedSeat && breakReports.some((report) => (
    report.seatId === selectedSeat.id && report.breakStartedAt === selectedSeat.breakStartedAt && report.reporterStudentNumber === studentNumber
  )))
  const selectedBreakReportable = Boolean(selectedSeat?.breakStartedAt && now - selectedSeat.breakStartedAt >= BREAK_REPORT_THRESHOLD)
  const counts = useMemo(() => locationSeats.reduce(
    (total, seat) => ({ ...total, [seat.status]: total[seat.status] + 1 }),
    { available: 0, reserved: 0, occupied: 0 },
  ), [locationSeats])
  const allCounts = useMemo(() => seats.reduce(
    (total, seat) => ({ ...total, [seat.status]: total[seat.status] + 1 }),
    { available: 0, reserved: 0, occupied: 0 },
  ), [seats])
  const mySeat = seats.find((seat) => seat.studentNumber === studentNumber && seat.status !== 'available')
  const favoritePreference = useMemo(() => {
    const seatUsage = new Map<string, { seatId: string; area: string; visits: number; duration: number; lastUsedAt: number }>()
    studySessions.forEach((session) => {
      if (session.studentNumber !== studentNumber || session.locationId !== selectedLocationId || !session.seatId) return
      const current = seatUsage.get(session.seatId) ?? {
        seatId: session.seatId,
        area: session.area,
        visits: 0,
        duration: 0,
        lastUsedAt: 0,
      }
      seatUsage.set(session.seatId, {
        ...current,
        area: session.area || current.area,
        visits: current.visits + 1,
        duration: current.duration + Math.max(0, (session.endedAt ?? now) - session.startedAt),
        lastUsedAt: Math.max(current.lastUsedAt, session.startedAt),
      })
    })
    return [...seatUsage.values()].sort((first, second) => (
      second.visits - first.visits || second.duration - first.duration || second.lastUsedAt - first.lastUsedAt
    ))[0] ?? null
  }, [now, selectedLocationId, studentNumber, studySessions])
  const personalizedRecommendations = useMemo(() => {
    if (!favoritePreference) return []
    const favoriteSeat = locationSeats.find((seat) => seat.id === favoritePreference.seatId)
    return locationSeats.filter((seat) => seat.status === 'available').map((seat) => {
      if (seat.id === favoritePreference.seatId) {
        return { seat, score: 1000 + favoritePreference.visits, reason: `Daha önce ${favoritePreference.visits} kez kullandın; şimdi boş.` }
      }
      if (favoriteSeat && seat.table === favoriteSeat.table) {
        return { seat, score: 500 + favoritePreference.visits, reason: `${favoriteSeat.table} içindeki benzer bir masa.` }
      }
      if (seat.area === favoritePreference.area) {
        return { seat, score: 200 + favoritePreference.visits, reason: `Sık kullandığın ${favoritePreference.area} alanında.` }
      }
      return null
    }).filter((recommendation): recommendation is NonNullable<typeof recommendation> => recommendation !== null)
      .sort((first, second) => second.score - first.score || first.seat.id.localeCompare(second.seat.id))
      .slice(0, 3)
  }, [favoritePreference, locationSeats])
  const leaderboardRows = useMemo(() => {
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const totals = new Map<string, { duration: number; active: boolean }>()
    const addDuration = (number: string, startedAt: number, endedAt: number | null) => {
      const start = Math.max(startedAt, startOfDay.getTime())
      const end = Math.min(endedAt ?? now, now)
      if (endedAt !== null && end <= start) return
      const current = totals.get(number) ?? { duration: 0, active: false }
      totals.set(number, { duration: current.duration + Math.max(0, end - start), active: current.active || endedAt === null })
    }

    studySessions.forEach((session) => addDuration(session.studentNumber, session.startedAt, session.endedAt))
    seats.forEach((seat) => {
      if (seat.status !== 'occupied' || !seat.studentNumber || !seat.checkedInAt) return
      const alreadyTracked = studySessions.some((session) => (
        session.studentNumber === seat.studentNumber && session.locationId === seat.locationId && session.seatId === seat.id && session.startedAt === seat.checkedInAt && session.endedAt === null
      ))
      if (!alreadyTracked) addDuration(seat.studentNumber, seat.checkedInAt, null)
    })

    return [...totals.entries()]
      .map(([number, total]) => ({ studentNumber: number, ...total }))
      .sort((first, second) => second.duration - first.duration || first.studentNumber.localeCompare(second.studentNumber))
  }, [now, seats, studySessions])
  const todayLabel = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const weeklyStudyDuration = useMemo(() => {
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
    let duration = 0
    const addDuration = (startedAt: number, endedAt: number | null) => {
      const start = Math.max(startedAt, startOfWeek.getTime())
      const end = Math.min(endedAt ?? now, now)
      if (end > start) duration += end - start
    }
    studySessions.forEach((session) => {
      if (session.studentNumber === studentNumber) addDuration(session.startedAt, session.endedAt)
    })
    seats.forEach((seat) => {
      if (seat.status !== 'occupied' || seat.studentNumber !== studentNumber || !seat.checkedInAt) return
      const tracked = studySessions.some((session) => (
        session.studentNumber === studentNumber && session.seatId === seat.id && session.startedAt === seat.checkedInAt
      ))
      if (!tracked) addDuration(seat.checkedInAt, null)
    })
    return duration
  }, [now, seats, studentNumber, studySessions])
  const weeklyGoalProgress = Math.min(100, Math.round((weeklyStudyDuration / (weeklyGoalHours * 60 * 60_000)) * 100))
  const selectedTableAvailableSeats = locationSeats.filter((seat) => seat.area === selectedSeat?.area && seat.status === 'available')
  const effectiveGroupSeatCount = Math.min(groupSeatCount, Math.max(2, selectedTableAvailableSeats.length))

  useEffect(() => {
    setEstimatedLeaveAt(selectedSeat?.estimatedLeaveAt ?? '')
    setEstimateError('')
    setSelectedGroupSeatIds([])
  }, [selectedSeat?.estimatedLeaveAt, selectedSeat?.id])
  const visibleGroups = useMemo(() => {
    const grouped = locationSeats.reduce<Record<string, Seat[]>>((result, seat) => {
      if (activeArea !== 'Tüm alanlar' && seat.area !== activeArea) return result
      if (searchQuery && !`${seat.code} ${seat.table} ${seat.area}`.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))) return result
      ;(result[seat.table] ??= []).push(seat)
      return result
    }, {})
    return Object.entries(grouped)
  }, [activeArea, locationSeats, searchQuery])
  useEffect(() => {
    // 1. Initial bootstrap from backend
    api.fetchBootstrap().then((data) => {
      if (Array.isArray(data.seats) && data.seats.length > 0) {
        setSeats(data.seats)
      }
      if (Array.isArray(data.studySessions)) {
        setStudySessions(data.studySessions)
      }
      if (Array.isArray(data.breakReports)) {
        setBreakReports(data.breakReports)
      }
      if (Array.isArray(data.studentNumbers) && data.studentNumbers.length > 0) {
        const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY)
        if (savedStudent && !data.studentNumbers.includes(savedStudent)) {
          localStorage.removeItem(STUDENT_STORAGE_KEY)
          localStorage.removeItem('kampus-masa-student-name-v1')
          setStudentNumber('')
          setStudentFullName('')
          setNotice('Sistemde böyle bir kayıt bulunamadı.')
        }
      }
    }).catch(() => {
      // Server not connected yet, local store is used as fallback
    })

    // 2. Real-time WebSocket updates
    const unsubStatus = api.on('connectionStatus', (status: ConnectionStatus) => {
      setWsStatus(status)
    })

    const unsubInit = api.on('INIT', (data: { seats?: Seat[]; studySessions?: StudySession[]; breakReports?: BreakReport[] }) => {
      if (Array.isArray(data?.seats)) setSeats(data.seats)
      if (Array.isArray(data?.studySessions)) setStudySessions(data.studySessions)
      if (Array.isArray(data?.breakReports)) setBreakReports(data.breakReports)
    })

    const unsubSeat = api.on('SEAT_UPDATED', (updatedSeat: Seat) => {
      setSeats((previous) => previous.map((seat) => seat.id === updatedSeat.id ? updatedSeat : seat))
    })

    const unsubBatch = api.on('SEATS_BATCH_UPDATED', (batchSeats: Seat[]) => {
      const map = new Map(batchSeats.map((seat) => [seat.id, seat]))
      setSeats((previous) => previous.map((seat) => map.get(seat.id) ?? seat))
    })

    const unsubSessions = api.on('STUDY_SESSIONS_SYNC', (sessions: StudySession[]) => {
      setStudySessions(sessions)
    })

    const unsubReports = api.on('BREAK_REPORTS_SYNC', (reports: BreakReport[]) => {
      setBreakReports(reports)
    })

    return () => {
      unsubStatus()
      unsubInit()
      unsubSeat()
      unsubBatch()
      unsubSessions()
      unsubReports()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('kampus-masa-active-view-v1', activeView)
    if (typeof window !== 'undefined' && window.location.hash !== `#${activeView}`) {
      window.history.replaceState(null, '', `#${activeView}`)
    }
  }, [activeView])

  const completeCheckIn = useCallback(async (seatId: string, mode: 'reservation' | 'walk-in') => {
    const seat = seats.find((item) => item.id === seatId)
    const canCheckIn = mode === 'reservation'
      ? seat?.status === 'reserved' && seat.studentNumber === studentNumber
      : seat?.status === 'available'
    if (!seat || !canCheckIn) {
      setScannerMessage(mode === 'reservation'
        ? 'Bu masa sizin adınıza rezerve edilmemiş.'
        : 'Bu masa artık boş değil. Haritadan başka bir masa seçin.')
      return
    }
    try {
      const res = await api.checkInSeat({
        seatId,
        studentNumber,
        receiptCode: seat.receiptCode ?? undefined,
      })
      setSeats((previous) => previous.map((item) => item.id === seatId
        ? { ...res.seat, estimatedLeaveAt: estimatedLeaveAt || seat.estimatedLeaveAt || null }
        : item))
      setScannerOpen(false)
      setScannerMode(null)
      setScannerMessage('')
      setReceiptSeatId(seatId)
      setNotice('QR doğrulandı. Masanız kullanımda olarak işaretlendi.')
    } catch (err: any) {
      setScannerMessage(err.message || 'Giriş yapılamadı.')
      setNotice(err.message || 'Giriş yapılamadı.')
    }
  }, [estimatedLeaveAt, seats, studentNumber])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      setSeats((previous) => {
        if (!previous.some((seat) => seat.status === 'reserved' && seat.expiresAt !== null && seat.expiresAt <= currentTime)) return previous
        return previous.map((seat) => (
          seat.status === 'reserved' && seat.expiresAt !== null && seat.expiresAt <= currentTime
            ? { ...seat, status: 'available', studentNumber: null, expiresAt: null, estimatedLeaveAt: null, breakStartedAt: null, reservationGroupId: null, reservationGroupSize: null }
            : seat
        ))
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem(SEAT_STORAGE_KEY, JSON.stringify(seats))
  }, [seats])

  useEffect(() => {
    localStorage.setItem(STUDY_SESSION_STORAGE_KEY, JSON.stringify(studySessions))
  }, [studySessions])

  useEffect(() => {
    localStorage.setItem(BREAK_REPORT_STORAGE_KEY, JSON.stringify(breakReports))
  }, [breakReports])

  useEffect(() => {
    if (studentNumber) localStorage.setItem(`${WEEKLY_GOAL_STORAGE_PREFIX}${studentNumber}`, String(weeklyGoalHours))
  }, [studentNumber, weeklyGoalHours])

  useEffect(() => {
    localStorage.setItem('kampus-masa-theme-v1', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!scannerOpen || !selectedSeat) return
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
          (selectedSeat.locationId === CENTRAL_LOCATION_ID && cleanDecoded === legacyCode2)
        ) {
          completeCheckIn(selectedSeat.id, scannerMode)
        } else {
          setScannerMessage('Bu QR seçili masaya ait değil. Masanın üzerindeki etiketi okutun.')
        }
      }

      // Strictly prioritize rear / back camera.
      // 1. Try finding device ID with back/rear/environment in label
      // 2. Fall back to facingMode: { exact: 'environment' }
      // 3. Fall back to facingMode: 'environment' for laptops with single webcam
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
      if (active) setScannerMessage('Kamera açılamadı. Tarayıcı izinlerini kontrol edin veya demo okutmayı kullanın.')
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
  }, [scannerOpen, scannerMode, selectedSeat, completeCheckIn])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  async function reserveSeat(seatId: string, owner: string, leaveAt: string) {
    try {
      const res = await api.reserveSeat({ seatId, studentNumber: owner })
      setSeats((previous) => previous.map((seat) => seat.id === seatId
        ? { ...res.seat, estimatedLeaveAt: leaveAt || null }
        : seat))
      setNotice('Masanız 15 dakika için adınıza ayrıldı.')
    } catch (err: any) {
      setNotice(err.message || 'Masa rezerve edilemedi.')
    }
  }

  async function reserveGroup(seatIds: string[], owner: string, seatCount: number) {
    const groupSeatIds = new Set(seatIds)
    const availableSeats = seats.filter((seat) => groupSeatIds.has(seat.id) && seat.status === 'available')
    if (seatIds.length !== seatCount || availableSeats.length !== seatCount) {
      setNotice('Seçtiğin koltuklardan biri artık boş değil. Koltukları yeniden seç.')
      setSelectedGroupSeatIds([])
      return
    }

    try {
      let reservedCount = 0
      for (const seatId of seatIds) {
        try {
          const res = await api.reserveSeat({ seatId, studentNumber: owner, groupSize: seatCount })
          setSeats((previous) => previous.map((s) => s.id === seatId ? res.seat : s))
          reservedCount++
        } catch {
          // Keep count
        }
      }
      setSelectedGroupSeatIds([])
      if (reservedCount > 0) {
        setNotice(`${reservedCount} koltuk arkadaş grubun için 15 dakika ayrıldı.`)
      } else {
        setNotice('Seçilen koltuklar rezerve edilemedi.')
      }
    } catch (err: any) {
      setNotice(err.message || 'Grup rezervasyonu tamamlanamadı.')
    }
  }

  function toggleGroupSeatSelection(seat: Seat) {
    if (seat.status !== 'available' || seat.area !== selectedSeat?.area) return
    if (selectedGroupSeatIds.includes(seat.id)) {
      setSelectedGroupSeatIds((previous) => previous.filter((seatId) => seatId !== seat.id))
    } else if (selectedGroupSeatIds.length >= effectiveGroupSeatCount) {
      setNotice(`En fazla ${effectiveGroupSeatCount} koltuk seçebilirsin.`)
    } else {
      setSelectedGroupSeatIds((previous) => [...previous, seat.id])
    }
  }

  function handleGroupReservation() {
    if (!selectedSeat || selectedSeat.status !== 'available') return
    if (selectedTableAvailableSeats.length < effectiveGroupSeatCount || selectedGroupSeatIds.length !== effectiveGroupSeatCount) {
      setNotice(`Grubun için ${effectiveGroupSeatCount} boş koltuk seç.`)
      return
    }
    if (!studentNumber) {
      setPendingAction('group-reserve')
      setLoginValue('')
      setLoginError('')
      setLoginOpen(true)
      return
    }
    reserveGroup(selectedGroupSeatIds, studentNumber, effectiveGroupSeatCount)
  }

  async function saveWeeklyGoal() {
    const nextGoal = Math.min(80, Math.max(1, Number(weeklyGoalInput) || 8))
    setWeeklyGoalHours(nextGoal)
    setWeeklyGoalInput(String(nextGoal))
    if (studentNumber) {
      await api.saveWeeklyGoal(studentNumber, nextGoal)
    }
  }

  function startWalkInCheckIn() {
    setScannerMessage('')
    setScannerMode('walk-in')
    setScannerOpen(true)
  }

  async function cancelReservation(seat: Seat) {
    try {
      const res = await api.releaseSeat({ seatId: seat.id, studentNumber })
      setSeats((previous) => previous.map((item) => item.id === seat.id ? res.seat : item))
      setNotice('Rezervasyon iptal edildi. Masa hemen boşaltıldı.')
    } catch (err: any) {
      setNotice(err.message || 'Rezervasyon iptal edilemedi.')
    }
  }

  function validateEstimatedLeaveTime() {
    if (!estimatedLeaveAt || isValidClockTime(estimatedLeaveAt)) {
      setEstimateError('')
      return true
    }
    setEstimateError('Saati 24 saat biçiminde yaz (ör. 18:30).')
    return false
  }

  function handleAction(action: 'reserve' | 'walk-in') {
    if (!selectedSeat) return
    if (selectedSeat.status !== 'available') return
    if (!validateEstimatedLeaveTime()) return
    if (!studentNumber) {
      setPendingAction(action)
      setLoginValue('')
      setLoginError('')
      setLoginOpen(true)
      return
    }
    if (action === 'reserve') reserveSeat(selectedSeat.id, studentNumber, estimatedLeaveAt)
    else startWalkInCheckIn()
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const studentNo = loginValue.trim()
    const password = loginPassword.trim() || studentNo
    if (!studentNo) {
      setLoginError('Lütfen öğrenci numaranızı girin.')
      return
    }

    try {
      const res = await api.login(studentNo, password)
      const validStudentNo = res.studentNo
      const name = res.fullName || (res.firstName && res.lastName ? `${res.firstName} ${res.lastName}` : `Öğrenci ${validStudentNo}`)
      setStudentNumber(validStudentNo)
      setStudentFullName(name)
      api.fetchWeeklyGoal(validStudentNo).then((goal) => {
        setWeeklyGoalHours(goal)
        setWeeklyGoalInput(String(goal))
      })
      localStorage.setItem(STUDENT_STORAGE_KEY, validStudentNo)
      localStorage.setItem('kampus-masa-student-name-v1', name)
      setLoginOpen(false)
      setNotice(`Giriş başarılı: ${name} (${validStudentNo})`)
      if (pendingAction === 'report-break' && selectedSeat?.status === 'occupied') {
        reportLongBreak(selectedSeat, validStudentNo)
      } else if (pendingAction === 'group-reserve' && selectedSeat?.status === 'available') {
        reserveGroup(selectedGroupSeatIds, validStudentNo, effectiveGroupSeatCount)
      } else if (pendingAction && selectedSeat?.status === 'available') {
        if (pendingAction === 'reserve') reserveSeat(selectedSeat.id, validStudentNo, estimatedLeaveAt)
        else startWalkInCheckIn()
      }
      setPendingAction(null)
      setAccountMenuOpen(false)
    } catch (err: any) {
      setLoginError(err.message || 'Giriş başarısız oldu.')
    }
  }

  async function endSession(seat: Seat) {
    try {
      const res = await api.releaseSeat({ seatId: seat.id, studentNumber })
      setSeats((previous) => previous.map((item) => item.id === seat.id ? res.seat : item))
      setReceiptSeatId(null)
      setSelectedSeatId(seat.id)
      setNotice('Oturum kapatıldı. Masa yeniden boş olarak işaretlendi.')
    } catch (err: any) {
      setNotice(err.message || 'Oturum kapatılamadı.')
    }
  }

  async function toggleBreak(seat: Seat) {
    const startingBreak = seat.breakStartedAt === null
    try {
      const res = startingBreak
        ? await api.startBreak({ seatId: seat.id, studentNumber })
        : await api.endBreak({ seatId: seat.id, studentNumber })
      setSeats((previous) => previous.map((item) => item.id === seat.id ? res.seat : item))
      setNotice(startingBreak ? 'Mola başladı. 20 dakika içinde masanı geri alabilirsin.' : 'Mola sona erdi. İyi çalışmalar!')
    } catch (err: any) {
      setNotice(err.message || 'Mola işlemi başarısız.')
    }
  }

  async function reportLongBreak(seat: Seat, reporter = studentNumber) {
    if (!reporter || seat.breakStartedAt === null || now - seat.breakStartedAt < BREAK_REPORT_THRESHOLD) return
    try {
      const res = await api.reportBreak({ seatId: seat.id, reporterStudentNumber: reporter })
      if (res.seat) {
        setSeats((previous) => previous.map((item) => item.id === seat.id ? res.seat! : item))
      }
      setNotice(res.message)
    } catch (err: any) {
      setNotice(err.message || 'Mola bildirimi iletilemedi.')
    }
  }


  function requestBreakReport(seat: Seat) {
    if (studentNumber) {
      reportLongBreak(seat)
      return
    }
    setPendingAction('report-break')
    setLoginValue('')
    setLoginError('')
    setLoginOpen(true)
  }

  const buildReceiptPdf = useCallback(async (seat: Seat): Promise<Blob> => {
    const locationName = locations.find((location) => location.id === seat.locationId)?.name ?? seat.locationId
    const receiptCode = seat.receiptCode ?? `KM-${new Date().getFullYear()}-${seat.code.replace('-', '')}`
    const generatedAt = Date.now()

      const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
      ])
      Object.assign(pdfMake, { vfs: pdfFonts })
      const documentDefinition: TDocumentDefinitions = {
        pageSize: 'A4' as const,
        pageMargins: [46, 42, 46, 48] as [number, number, number, number],
        info: {
          title: `Kütüphane kullanım fişi ${receiptCode}`,
          author: 'Kampüs Masa',
          subject: 'Doğrulanmış masa oturumu',
        },
        content: [
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'KAMPÜS MASA', style: 'brand' },
                  { text: 'KÜTÜPHANE · DİJİTAL KULLANIM BELGESİ', style: 'eyebrow' },
                ],
              },
              {
                width: 104,
                stack: [
                  { text: 'OTURUM DURUMU', style: 'smallLabel', alignment: 'right' },
                  { text: 'AKTİF', style: 'activeStatus', alignment: 'right' },
                ],
              },
            ],
          },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 518, y2: 0, lineWidth: 1, lineColor: '#dfe7dd' }], margin: [0, 16, 0, 25] },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'MASA KULLANIM FİŞİ', style: 'eyebrow' },
                  { text: 'Oturum onaylandı', style: 'title' },
                  { text: 'Kütüphane çalışma alanı kullanım belgesi', style: 'subtitle' },
                ],
              },
              {
                width: 160,
                table: {
                  widths: ['*'],
                  body: [[{
                    stack: [
                      { text: 'FİŞ NUMARASI', style: 'smallLabel' },
                      { text: receiptCode, style: 'receiptCode' },
                    ],
                    fillColor: '#f1f6ee',
                    margin: [12, 11, 12, 11],
                  }]],
                },
                layout: 'noBorders',
              },
            ],
            columnGap: 18,
          },
          { text: 'OTURUM BİLGİLERİ', style: 'sectionTitle', margin: [0, 30, 0, 10] },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { stack: [{ text: 'ÖĞRENCİ NUMARASI', style: 'smallLabel' }, { text: seat.studentNumber ?? '—', style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                  { stack: [{ text: 'GİRİŞ SAATİ', style: 'smallLabel' }, { text: formatClock(seat.checkedInAt), style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                ],
                [
                  { stack: [{ text: 'ÇALIŞMA NOKTASI', style: 'smallLabel' }, { text: locationName, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                  { stack: [{ text: 'MASA', style: 'smallLabel' }, { text: `${seat.code} · ${seat.table}`, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                ],
                [
                  { stack: [{ text: 'ÇALIŞMA ALANI', style: 'smallLabel' }, { text: seat.area, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                  { stack: [{ text: 'TAHMİNİ ÇIKIŞ', style: 'smallLabel' }, { text: seat.estimatedLeaveAt || 'Belirtilmedi', style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 5,
              vLineWidth: () => 8,
              hLineColor: () => '#ffffff',
              vLineColor: () => '#ffffff',
            },
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'QR DOĞRULAMA', style: 'sectionTitle' },
                  { text: 'Bu kod, fiş numarası ve masa oturumuyla eşleşir.', style: 'subtitle', margin: [0, 6, 0, 0] },
                  { text: `Belge oluşturulma saati · ${formatClock(generatedAt)}`, style: 'smallLabel', margin: [0, 15, 0, 0] },
                ],
                margin: [0, 18, 0, 0],
              },
              {
                width: 136,
                stack: [
                  { qr: `KUTUPHANE-FIS:${receiptCode}`, fit: 112, eccLevel: 'M', foreground: '#204936', background: '#ffffff', alignment: 'center' },
                  { text: 'DOĞRULAMA KODU', style: 'smallLabel', alignment: 'center', margin: [0, 7, 0, 0] },
                ],
              },
            ],
            columnGap: 14,
            margin: [0, 24, 0, 0],
          },
        ],
        footer: (currentPage: number, pageCount: number) => ({
          columns: [
            { text: 'KAMPÜS MASA · KÜTÜPHANE OTURUM BELGESİ', alignment: 'left' },
            { text: `${currentPage} / ${pageCount}`, alignment: 'right' },
          ],
          margin: [46, 0, 46, 20],
          fontSize: 8,
          color: '#819084',
        }),
        defaultStyle: { font: 'Roboto', color: '#263a2d' },
        styles: {
          brand: { fontSize: 12, bold: true, color: '#204936', characterSpacing: 1.1 },
          eyebrow: { fontSize: 8, bold: true, color: '#758579', characterSpacing: 1 },
          smallLabel: { fontSize: 7, bold: true, color: '#829084', characterSpacing: .6 },
          activeStatus: { fontSize: 10, bold: true, color: '#4e8155', margin: [0, 4, 0, 0] },
          title: { fontSize: 23, bold: true, color: '#1f3f2e', margin: [0, 8, 0, 5] },
          subtitle: { fontSize: 9, color: '#748176', lineHeight: 1.35 },
          receiptCode: { fontSize: 12, bold: true, color: '#254b36', margin: [0, 5, 0, 0] },
          sectionTitle: { fontSize: 9, bold: true, color: '#335741', characterSpacing: .8 },
          fieldValue: { fontSize: 10, bold: true, color: '#34493a', margin: [0, 5, 0, 0], lineHeight: 1.25 },
        },
      }

      const pdfDocument = pdfMake.createPdf(documentDefinition) as ReturnType<typeof pdfMake.createPdf> & {
        getBlob: (callback: (blob: Blob) => void) => void
      }
      return await new Promise<Blob>((resolve, reject) => {
        try {
          pdfDocument.getBlob(resolve)
        } catch (error) {
          reject(error)
        }
      })
  }, [])

  useEffect(() => {
    if (!receiptSeat) {
      setReceiptPdfUrl(null)
      setReceiptPdfError('')
      return
    }
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
  }, [buildReceiptPdf, receiptSeat])

  function statusLabel(status: SeatStatus) {
    return status === 'available' ? 'Boş' : status === 'reserved' ? 'Rezerve' : 'Dolu'
  }

  function changeLocation(locationId: string) {
    setSelectedLocationId(locationId)
    setActiveArea('Tüm alanlar')
    setSearchQuery('')
    const nextLoc = locations.find((loc) => loc.id === locationId)
    const initialFloor = nextLoc?.floors ? 1 : 1
    setSelectedFloor(initialFloor)
    const nextSeat = seats.find((seat) => seat.locationId === locationId && (nextLoc?.floors ? seat.floor === initialFloor : true) && seat.status === 'available')
      ?? seats.find((seat) => seat.locationId === locationId && (nextLoc?.floors ? seat.floor === initialFloor : true))
    if (nextSeat) setSelectedSeatId(nextSeat.id)
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Kampüs Masa ana sayfa">
          <span className="brand-mark"><img src="/logo.png" alt="Kampüs Masa Logo" className="brand-logo-img" /></span>
          <span className="brand-copy"><strong>kampüs masa</strong></span>
        </a>
        <div className="nav-label">ÇALIŞMA ALANI</div>
        <nav className="primary-nav" aria-label="Ana menü">
          <button className={`nav-item ${activeView === 'map' ? 'active' : ''}`} type="button" onClick={() => setActiveView('map')}><MapPin size={18} /> Masa haritası <span className="nav-count">{counts.available}</span></button>
          <button className={`nav-item ${activeView === 'ai' ? 'active' : ''}`} type="button" onClick={() => setActiveView('ai')}><Brain size={18} /> Akıllı Asistan</button>
          <button className={`nav-item ${activeView === 'leaderboard' ? 'active' : ''}`} type="button" onClick={() => setActiveView('leaderboard')}><Trophy size={18} /> Günün kazananı</button>
          <button className={`nav-item ${activeView === 'exams' ? 'active' : ''}`} type="button" onClick={() => setActiveView('exams')}><Calendar size={18} /> Sınav takvimi <span className="nav-count">{exams.length}</span></button>
          <button className={`nav-item ${activeView === 'board' ? 'active' : ''}`} type="button" onClick={() => setActiveView('board')}><MessageSquare size={18} /> Pano & Notlar <span className="nav-count">{notes.length}</span></button>
          <button className="nav-item" type="button" onClick={() => mySeat ? setReceiptSeatId(mySeat.id) : setNotice('Henüz aktif bir masa fişiniz yok.')}><ReceiptText size={18} /> Fişlerim</button>
        </nav>

        <div className="sidebar-rule" />
        <div className="nav-label">BUGÜN KÜTÜPHANE</div>
        <div className="hours-row"><Clock3 size={16} /><span>Açık · 22.00’ye kadar</span></div>
        <div className="occupancy-block">
          <div className="occupancy-head"><span>Anlık doluluk</span><strong>{Math.round((counts.occupied / locationSeats.length) * 100)}%</strong></div>
          <div className="occupancy-track"><span style={{ width: `${Math.round((counts.occupied / locationSeats.length) * 100)}%` }} /></div>
          <small>{counts.occupied} masa kullanımda · {counts.available} masa boş</small>
        </div>

        {nearestUpcomingExam && (
          <button
            type="button"
            className="sidebar-exam-card"
            onClick={() => setActiveView('exams')}
            title="Sınav takvimini ve geri sayımı aç"
            aria-label={`${nearestUpcomingExam.courseName} sınav geri sayımı`}
          >
            <div className="sidebar-exam-kicker">
              <Clock3 size={12} />
              <span>EN YAKIN SINAV</span>
            </div>
            <div className="sidebar-exam-info">
              <strong>{nearestUpcomingExam.courseName}</strong>
              <span className={`sidebar-exam-badge type-${nearestUpcomingExam.type}`}>
                {nearestUpcomingExam.type === 'diger' ? 'ÖDEV/PROJE' : nearestUpcomingExam.type.toLocaleUpperCase('tr-TR')}
              </span>
            </div>
            <div className="sidebar-exam-countdown">
              {getExamRemaining(nearestUpcomingExam.date, nearestUpcomingExam.time, now).text}
            </div>
          </button>
        )}

        <div className="sidebar-bottom">
          <button className="help-box" type="button" onClick={() => setHelpOpen(true)} aria-label="Kütüphane danışma ve iletişim">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <div>
              <strong>Yardıma mı ihtiyacın var?</strong>
              <span>Kütüphane danışma</span>
            </div>
            <ArrowRight size={15} />
          </button>

          <div className="developer-box">
            <span className="developer-tag">PROJE GELİŞTİRİCİ</span>
            <strong className="developer-name">by Aksoy</strong>
            <a
              className="developer-feedback"
              href="mailto:esa94tokat@gmail.com?subject=Kampus%20Masa%20Geri%20Bildirim"
              title="Geri bildirim gönder: esa94tokat@gmail.com"
            >
              <Mail size={12} />
              <span>esa94tokat@gmail.com</span>
            </a>
          </div>

          <div className="prototype-note"><ShieldCheck size={14} /> Öğrenci kullanımına özel</div>
        </div>
      </aside>

      <main className="main-area" id="top">
        <header className="topbar">
          <div className="breadcrumb"><span>Kampüs</span><span className="crumb-slash">/</span><strong>{activeView === 'map' ? selectedLocation.name : activeView === 'leaderboard' ? 'Günün kazananı' : activeView === 'board' ? 'Kütüphane Panosu & Notlar' : activeView === 'ai' ? 'Akıllı Asistan & Doluluk Tahmini' : 'Sınav takvimi & Geri sayım'}</strong></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" aria-label="Kütüphane danışma ve iletişim" title="Kütüphane danışma ve iletişim" onClick={() => setHelpOpen(true)}><CircleHelp size={16} /></button>
            <button className="theme-toggle" type="button" aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'} title={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'} onClick={() => setDarkMode((active) => !active)}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
            <div className="live-indicator" title={wsStatus === 'connected' ? 'Merkezi sunucuya canlı bağlı' : 'Bağlantı kuruluyor...'}>
              <span className={wsStatus === 'connected' ? 'live-dot-pulse' : 'live-dot-connecting'} />
              {wsStatus === 'connected' ? 'Canlı senkronize' : 'Bağlanıyor...'}
            </div>
            {studentNumber ? (
              <div className="account-menu">
                <button className="user-button" type="button" onClick={() => setAccountMenuOpen((open) => !open)} title="Hesap seçenekleri" aria-haspopup="menu" aria-expanded={accountMenuOpen}>
                  <span className="user-avatar">{studentFullName ? studentFullName.charAt(0) : studentNumber.slice(-2)}</span><span className="user-number">{studentFullName || studentNumber}</span><ChevronDown size={15} />
                </button>
                {accountMenuOpen && <div className="account-menu-popover" role="menu">
                  <span className="account-menu-label">ÖĞRENCİ HESABI</span>
                  <strong>{studentFullName || studentNumber}</strong>
                  {studentFullName && <small style={{ display: 'block', color: 'var(--text-muted, #7b8e7e)', fontSize: '11px', marginTop: '2px' }}>No: {studentNumber}</small>}
                  <button className="account-logout" type="button" role="menuitem" onClick={() => { setStudentNumber(''); setStudentFullName(''); localStorage.removeItem(STUDENT_STORAGE_KEY); localStorage.removeItem('kampus-masa-student-name-v1'); setAccountMenuOpen(false); setNotice('Oturum kapatıldı.') }}><LogOut size={15} /> Çıkış yap</button>
                </div>}
              </div>
            ) : (
              <button className="login-button" type="button" onClick={() => { setLoginValue(''); setLoginError(''); setLoginOpen(true) }}><KeyRound size={15} /> Öğrenci girişi</button>
            )}
          </div>
        </header>

        <div className="page-content">
          <section className="page-intro">
            <div>
              <div className="eyebrow"><span className="eyebrow-mark">{activeView === 'map' ? <Sparkles size={13} /> : activeView === 'leaderboard' ? <Trophy size={13} /> : activeView === 'board' ? <MessageSquare size={13} /> : activeView === 'ai' ? <Brain size={13} /> : <Calendar size={13} />}</span> {activeView === 'map' ? currentSectionLabel : activeView === 'leaderboard' ? 'GÜNLÜK SIRALAMA · TÜM ÇALIŞMA NOKTALARI' : activeView === 'board' ? 'KÜTÜPHANE TOPLULUK PANOSU · DUYURU & NOTLAR' : activeView === 'ai' ? 'AKILLI KÜTÜPHANE DANIŞMANI · DOLULUK ANALİZİ' : 'AKADEMİK PLANLAMA · SINAV GERİ SAYIMI'}</div>
              {activeView === 'map' ? <><h1>Yerini bul.<br /><span>Rahatça çalış.</span></h1><p>{selectedLocation.name} {currentFloorLabel} alanlarını ve boş masaları görüntüle.</p></> : activeView === 'leaderboard' ? <><h1>Bugünün<br /><span>çalışma liderleri.</span></h1><p>Tüm çalışma noktalarındaki toplam oturum süreleri.</p></> : activeView === 'board' ? <><h1>Kütüphane panosu.<br /><span>Not bırak & yardımlaş.</span></h1><p>Kayıp eşya, çalışma soruları veya duyuruları paylaş, yorumlarla hemen haberleş.</p></> : activeView === 'ai' ? <><h1>Akıllı asistan.<br /><span>Doluluk analizi.</span></h1><p>Gebze Teknik Üniversitesi kütüphane verileriyle anlık ve saatlik doluluk tahminleri.</p></> : <><h1>Hedefine odaklan.<br /><span>Sınav geri sayımı.</span></h1><p>Vize ve final sınav tarihlerini kaydet, kalan süreyi saniye saniye takip et.</p></>}
            </div>
            <div className="intro-meta"><span className="meta-icon">{activeView === 'map' ? <Clock3 size={17} /> : activeView === 'leaderboard' ? <Medal size={17} /> : activeView === 'board' ? <MessageSquare size={17} /> : activeView === 'ai' ? <ShieldCheck size={17} /> : <GraduationCap size={17} />}</span><div><span>{activeView === 'map' ? 'Bugün çalışma saatleri' : activeView === 'leaderboard' ? 'Sıralama tarihi' : activeView === 'board' ? 'Aktif not sayısı' : activeView === 'ai' ? 'Kapsam' : 'Kayıtlı sınav sayısı'}</span><strong>{activeView === 'map' ? selectedLocation.hours : activeView === 'leaderboard' ? todayLabel : activeView === 'board' ? `${notes.length} Not Paylaşıldı` : activeView === 'ai' ? 'Tüm Katlar ve Çalışma Alanları' : `${exams.length} Sınav Planlandı`}</strong></div></div>
          </section>

          {activeView === 'map' && <div className="location-toolbar"><div><span className="section-kicker">KAMPÜS ÇALIŞMA NOKTALARI</span><strong>Çalışma alanı seç</strong></div><label className="location-select"><MapPin size={16} /><select aria-label="Çalışma alanı" value={selectedLocationId} onChange={(event) => changeLocation(event.target.value)}>{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select><ChevronDown size={15} /></label></div>}

          <section className="summary-strip" aria-label={activeView === 'map' ? `${selectedLocation.name} masa durumları` : activeView === 'leaderboard' ? 'Tüm kampüs masa durumları' : activeView === 'board' ? 'Kütüphane panosu durumları' : activeView === 'ai' ? 'Yapay zeka ve model durumu' : 'Sınav takvimi özeti'}>
            <div className="summary-title"><span className="summary-live" /> ŞU AN <strong>{activeView === 'map' ? `${selectedLocation.shortName} · ${currentFloorLabel}` : activeView === 'leaderboard' ? 'TÜM NOKTALAR' : activeView === 'board' ? 'TOPLULUK PANOSU' : activeView === 'ai' ? 'KÜTÜPHANE REHBERİ' : 'SINAV TAKVİMİ'}</strong></div>
            <div className="summary-divider" />
            {activeView === 'ai' ? (
              <>
                <div className="summary-stat"><span className="summary-dot available-dot" /><span>Durum</span><strong>Canlı Analiz</strong></div>
                <div className="summary-stat"><span className="summary-dot reserved-dot" /><span>Kapsam</span><strong>1. ve 2. Kat</strong></div>
                <div className="summary-stat"><span className="summary-dot occupied-dot" /><span>Öngörü</span><strong>Saatlik Eğri</strong></div>
                <span className="summary-refresh">Veri: <strong>GTÜ Kütüphanesi</strong></span>
              </>
            ) : activeView === 'exams' ? (
              <>
                <div className="summary-stat"><span className="summary-dot available-dot" /><span>Vize</span><strong>{exams.filter((e) => e.type === 'vize').length}</strong></div>
                <div className="summary-stat"><span className="summary-dot reserved-dot" /><span>Final</span><strong>{exams.filter((e) => e.type === 'final').length}</strong></div>
                <div className="summary-stat"><span className="summary-dot occupied-dot" /><span>Diğer</span><strong>{exams.filter((e) => e.type === 'diger' || e.type === 'butunleme' || e.type === 'quiz').length}</strong></div>
                <span className="summary-refresh">En yakın: <strong>{nearestUpcomingExam ? `${nearestUpcomingExam.courseName} (${getExamRemaining(nearestUpcomingExam.date, nearestUpcomingExam.time, now).days} gün)` : 'Yok'}</strong></span>
              </>
            ) : activeView === 'board' ? (
              <>
                <div className="summary-stat"><span className="summary-dot occupied-dot" /><span>Kayıp Eşya</span><strong>{notes.filter((n) => n.category === 'kayip' && !n.isResolved).length}</strong></div>
                <div className="summary-stat"><span className="summary-dot available-dot" /><span>Bulundu</span><strong>{notes.filter((n) => n.category === 'bulundu' && !n.isResolved).length}</strong></div>
                <div className="summary-stat"><span className="summary-dot reserved-dot" /><span>Ders / Genel</span><strong>{notes.filter((n) => (n.category === 'yardim' || n.category === 'genel') && !n.isResolved).length}</strong></div>
                <span className="summary-refresh">Çözülen: <strong>{notes.filter((n) => n.isResolved).length} not</strong></span>
              </>
            ) : (
              <>
                <div className="summary-stat"><span className="summary-dot available-dot" /><span>Boş</span><strong>{activeView === 'map' ? counts.available : allCounts.available}</strong></div>
                <div className="summary-stat"><span className="summary-dot reserved-dot" /><span>Rezerve</span><strong>{activeView === 'map' ? counts.reserved : allCounts.reserved}</strong></div>
                <div className="summary-stat"><span className="summary-dot occupied-dot" /><span>Dolu</span><strong>{activeView === 'map' ? counts.occupied : allCounts.occupied}</strong></div>
                <span className="summary-refresh">Güncel <span>şimdi</span></span>
              </>
            )}
          </section>

          {activeView === 'map' && (
            <section className="ai-map-banner" aria-label="Yapay Zeka Doluluk Asistanı">
              <div className="ai-map-banner-left">
                <div className="ai-map-banner-icon">
                  <Brain size={18} />
                </div>
                <div>
                  <div className="ai-map-banner-kicker">
                    <Sparkles size={12} />
                    <span>KÜTÜPHANE REHBERİ</span>
                  </div>
                  <strong>Akıllı Doluluk Tahmini & Asistan</strong>
                  <p>Günün ilerleyen saatleri için yoğunluk tahminlerini görüntüle ve sana en uygun masayı seç.</p>
                </div>
              </div>
              <button
                type="button"
                className="ai-map-banner-btn"
                onClick={() => setActiveView('ai')}
              >
                <span>Asistanı ve Tahmini Aç</span>
                <ArrowRight size={15} />
              </button>
            </section>
          )}

          {activeView === 'map' && studentNumber && <section className="recommendation-strip" aria-label="Sana özel masa önerileri">
            <div className="recommendation-heading"><span className="recommendation-kicker"><Sparkles size={13} /> SANA ÖZEL</span><strong>Bir sonraki masan</strong><span>{favoritePreference ? `${favoritePreference.visits} geçmiş oturumuna göre` : 'Tercihlerin oluştukça öneriler kişiselleşir.'}</span></div>
            {personalizedRecommendations.length > 0 ? <div className="recommendation-list">
              {personalizedRecommendations.map(({ seat, reason }) => <button className="recommendation-item" key={seat.id} type="button" onClick={() => {
                setActiveArea('Tüm alanlar')
                setSearchQuery('')
                setSelectedSeatId(seat.id)
              }}>
                <span className="recommendation-seat"><MapPin size={14} /> {seat.code}</span>
                <span className="recommendation-reason">{seat.id === favoritePreference?.seatId ? `Favori yerin ${seat.code} boş, oturabilirsin.` : reason}</span>
                <span className="recommendation-available"><i /> Şimdi boş</span>
                <ArrowRight className="recommendation-arrow" size={15} />
              </button>)}
            </div> : <div className="recommendation-empty">{favoritePreference ? 'Tercih ettiğin alanlarda şu an boş masa yok.' : 'İlk masa oturumundan sonra sana uygun boş masaları burada göstereceğim.'}</div>}
          </section>}

          {activeView === 'map' && studentNumber && <section className="weekly-goal-strip" aria-label="Haftalık çalışma hedefi">
            <div className="weekly-goal-copy"><span className="recommendation-kicker"><Clock3 size={13} /> BU HAFTA</span><strong>Çalışma hedefin</strong><span>{formatElapsed(weeklyStudyDuration)} çalıştın</span></div>
            <div className="weekly-goal-progress"><div className="weekly-goal-progress-label"><span>{formatElapsed(weeklyStudyDuration)} / {weeklyGoalHours} sa</span><strong>%{weeklyGoalProgress}</strong></div><div className="weekly-goal-track" role="progressbar" aria-label="Haftalık çalışma hedefi ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weeklyGoalProgress}><span style={{ width: `${weeklyGoalProgress}%` }} /></div></div>
            <label className="weekly-goal-input"><span>Haftalık hedef</span><span><input type="number" min={1} max={80} step={1} value={weeklyGoalInput} aria-label="Haftalık çalışma hedefi, saat" onChange={(event) => setWeeklyGoalInput(event.target.value)} onBlur={saveWeeklyGoal} onKeyDown={(event) => { if (event.key === 'Enter') { saveWeeklyGoal(); event.currentTarget.blur() } }} /> sa</span></label>
          </section>}

          {activeView === 'map' && <div className="workspace-grid">
            <section className="map-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">KAT PLANI · {selectedLocation.name.toLocaleUpperCase('tr-TR')}</span>
                  <h2>{currentMapTitle}</h2>
                </div>
                {selectedLocation.floors && selectedLocation.floors.length > 1 ? (
                  <div className="floor-switcher" role="tablist" aria-label="Kat seçimi">
                    {selectedLocation.floors.map((fl) => (
                      <button
                        key={fl.floorNumber}
                        type="button"
                        role="tab"
                        aria-selected={selectedFloor === fl.floorNumber}
                        className={`floor-switcher-btn ${selectedFloor === fl.floorNumber ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFloor(fl.floorNumber)
                          const nextSeat = seats.find(
                            (s) => s.locationId === selectedLocationId && s.floor === fl.floorNumber && s.status === 'available'
                          ) ?? seats.find((s) => s.locationId === selectedLocationId && s.floor === fl.floorNumber)
                          if (nextSeat) setSelectedSeatId(nextSeat.id)
                        }}
                      >
                        <span className="floor-icon">{String(fl.floorNumber).padStart(2, '0')}</span>
                        {fl.floorLabel}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="floor-single-badge">
                    <span className="floor-icon">{floorBadge}</span>
                    {selectedLocation.floorLabel}
                  </div>
                )}
              </div>
              <div className="map-toolbar">
                <div className="area-tabs" role="tablist" aria-label="Alan seçimi">
                  {locationAreas.map((area) => <button className={activeArea === area ? 'area-tab selected' : 'area-tab'} key={area} type="button" role="tab" aria-selected={activeArea === area} onClick={() => setActiveArea(area)}>{area}</button>)}
                </div>
                <label className="map-search"><Search size={15} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Masa ara" aria-label="Masa ara" /><kbd>⌘ K</kbd></label>
              </div>

              <div className="floor-map">
                <div className="map-edge-label"><span>CAM CEPHE</span><span className="window-line" /></div>
                <div className="map-content">
                  <div className="map-side-label"><span>SESSİZ ÇALIŞMA</span><span className="side-rail" /></div>
                  <div className="table-grid">
                    {visibleGroups.map(([tableName, tableSeats], index) => (
                      <article className={`table-card table-card-${index % 4}`} key={tableName}>
                        <div className="table-card-heading"><span className="table-symbol"><Armchair size={15} /></span><div><strong>{tableName}</strong><small>{tableSeats[0]?.area}</small></div><span className="table-capacity">{tableSeats.filter((seat) => seat.status === 'available').length}/{tableSeats.length}</span></div>
                        <div className="table-layout">
                          <div className="seat-row">{tableSeats.slice(0, 2).map((seat) => <button key={seat.id} className={`seat ${seat.status} ${selectedSeatId === seat.id ? 'is-selected' : ''} ${seat.studentNumber === studentNumber && studentNumber ? 'mine' : ''}`} onClick={() => setSelectedSeatId(seat.id)} type="button" aria-label={`${seat.code}, ${statusLabel(seat.status)}`} title={`${seat.code} · ${statusLabel(seat.status)}`}><span>{seat.code.slice(-2)}</span></button>)}</div>
                          <div className="desk-surface"><span className="desk-notch" /><span>{tableName.replace(' ', '\u00a0')}</span><span className="desk-notch" /></div>
                          <div className="seat-row">{tableSeats.slice(2, 4).map((seat) => <button key={seat.id} className={`seat ${seat.status} ${selectedSeatId === seat.id ? 'is-selected' : ''} ${seat.studentNumber === studentNumber && studentNumber ? 'mine' : ''}`} onClick={() => setSelectedSeatId(seat.id)} type="button" aria-label={`${seat.code}, ${statusLabel(seat.status)}`} title={`${seat.code} · ${statusLabel(seat.status)}`}><span>{seat.code.slice(-2)}</span></button>)}</div>
                        </div>
                      </article>
                    ))}
                    {visibleGroups.length === 0 && <div className="empty-map"><Search size={20} /><strong>Masa bulunamadı</strong><span>Başka bir masa numarası deneyin.</span></div>}
                  </div>
                  <div className="map-side-label right-side-label"><span>GRUP ÇALIŞMA</span><span className="side-rail" /></div>
                </div>
                <div className="map-bottom"><span className="door-marker"><DoorOpen size={15} /> GİRİŞ</span><span className="map-dimensions">{currentMapLabel}</span><span className="stairs-marker"><ArrowDownRight size={14} /> Merdiven</span></div>
              </div>

              <div className="map-legend">
                <span><i className="legend-dot available-dot" /> Boş</span><span><i className="legend-dot reserved-dot" /> Rezerve</span><span><i className="legend-dot occupied-dot" /> Dolu</span>
                <span className="legend-hint"><Info size={13} /> Durum için masaya dokun</span>
              </div>
            </section>

            <aside className="detail-panel">
              <div className="detail-header"><div><span className="section-kicker">MASA DETAYI</span><h2>{selectedSeat?.code ?? 'Masa seç'}</h2></div>{selectedSeat && <span className={`status-pill ${selectedSeat.status}`}><i />{statusLabel(selectedSeat.status)}</span>}</div>
              {selectedSeat && selectedSeat.locationId === selectedLocationId ? (
                <>
                  <div className="selected-location"><span className="location-pin"><MapPin size={17} /></span><div><strong>{selectedLocation.name} · {selectedSeat.table}</strong><span>{currentFloorLabel} · {selectedSeat.area}</span></div></div>
                  <div className={`availability-card ${selectedSeat.status}`}>
                    <div className="availability-icon">{selectedSeat.status === 'available' ? <Check size={19} /> : selectedSeat.status === 'reserved' ? <Clock3 size={19} /> : <UsersRound size={19} />}</div>
                    <div className="availability-copy">
                      <strong>{selectedSeat.status === 'available' ? 'Bu masa seni bekliyor' : selectedSeat.studentNumber === studentNumber && studentNumber ? 'Bu masa senin' : selectedSeat.status === 'reserved' ? 'Kısa süreli rezerve' : 'Şu an kullanımda'}</strong>
                      <span>{selectedSeat.status === 'available' ? 'Hemen oturabilir veya 15 dk ayırabilirsin.' : selectedSeat.status === 'reserved' ? selectedSeat.studentNumber === studentNumber ? 'QR’ı okutarak girişini tamamla.' : 'Rezervasyon onaylanınca tekrar boşalabilir.' : selectedSeat.studentNumber === studentNumber ? 'E-fişin masanın sana ait olduğunu gösterir.' : 'Bu masada şu anda bir öğrenci çalışıyor.'}</span>
                    </div>
                  </div>

                  {selectedSeat.status === 'reserved' && selectedSeat.expiresAt && (
                    <div className="countdown-card"><span className="countdown-icon"><Clock3 size={17} /></span><div><span>Rezervasyonun bitmesine</span><strong>{formatTime(selectedSeat.expiresAt - now)}</strong></div><small>15 dk</small></div>
                  )}
                  {selectedSeat.status === 'reserved' && selectedSeat.reservationGroupSize && <div className="group-reservation-note"><UsersRound size={15} /><span>{selectedSeat.reservationGroupSize} kişilik grup rezervasyonu · bu masadaki koltukların QR girişini 15 dk içinde tamamlayın.</span></div>}

                  <div className="detail-facts"><div><span>Oturma düzeni</span><strong>Bireysel masa</strong></div><div><span>Priz</span><strong className="fact-yes"><Check size={13} /> Var</strong></div></div>

                  {(selectedSeat.status === 'available' || (selectedSeat.status === 'reserved' && selectedSeat.studentNumber === studentNumber)) && <>
                    <label className="estimate-field"><span>Tahmini çıkış <small>İsteğe bağlı</small></span><input type="text" inputMode="numeric" autoComplete="off" maxLength={5} placeholder="Örn. 18:30" value={estimatedLeaveAt} aria-invalid={Boolean(estimateError)} onBlur={validateEstimatedLeaveTime} onChange={(event) => {
                      const value = event.target.value
                      setEstimatedLeaveAt(value)
                      setEstimateError(value && !isValidClockTime(value) ? 'Saati SS:DD biçiminde yaz (ör. 18:30).' : '')
                      if (selectedSeat.status === 'reserved' && (!value || isValidClockTime(value))) {
                        setSeats((previous) => previous.map((seat) => seat.id === selectedSeat.id ? { ...seat, estimatedLeaveAt: value || null } : seat))
                      }
                    }} /></label>
                    {estimateError && <span className="estimate-error" role="alert">{estimateError}</span>}
                  </>}

                  {selectedSeat.status === 'occupied' && <div className="occupancy-facts"><div><span>{selectedSeat.breakStartedAt ? 'Mola süresi' : 'Ne zamandır dolu?'}</span><strong>{formatDuration(selectedSeat.breakStartedAt ?? selectedSeat.checkedInAt, now)}</strong></div><div><span>Tahmini çıkış</span><strong>{selectedSeat.estimatedLeaveAt || 'Belirtilmedi'}</strong></div></div>}

                  {selectedSeat.status === 'available' && <>
                    <div className="action-stack"><button className="primary-action" type="button" onClick={() => handleAction('reserve')}><Clock3 size={17} /> 15 dk ayır <ArrowRight size={16} /></button><button className="secondary-action" type="button" onClick={() => handleAction('walk-in')}><ScanLine size={17} /> QR okutarak otur</button><span className="action-footnote"><Info size={13} /> Oturmadan önce masadaki QR kodunu kamerayla okut.</span></div>
                    <section className="group-reservation-control" aria-label="Arkadaş grubu rezervasyonu"><div className="group-reservation-heading"><UsersRound size={16} /><div><strong>Arkadaş grubuna ayır</strong><span>Boş koltukları tek tek seç · aynı çalışma alanı</span></div></div><div className="group-size-select"><span>Kişi sayısı</span><div className="group-size-options" role="group" aria-label="Grup kişi sayısı">{[2, 3, 4].map((count) => <button key={count} className={effectiveGroupSeatCount === count ? 'selected' : ''} type="button" aria-pressed={effectiveGroupSeatCount === count} disabled={selectedTableAvailableSeats.length < count} onClick={() => { setGroupSeatCount(count); setSelectedGroupSeatIds([]) }}>{count}</button>)}</div></div><div className="group-seat-options" role="group" aria-label="Grup koltukları">{selectedTableAvailableSeats.map((seat) => <button key={seat.id} className={`group-seat-option ${selectedGroupSeatIds.includes(seat.id) ? 'selected' : ''}`} type="button" aria-pressed={selectedGroupSeatIds.includes(seat.id)} title={`${seat.code} · ${seat.table}`} onClick={() => toggleGroupSeatSelection(seat)}><strong>{seat.code}</strong><span>{seat.table}</span></button>)}</div><span className="group-selection-count">{selectedGroupSeatIds.length} / {effectiveGroupSeatCount} koltuk seçildi</span><button className="group-reserve-button" type="button" disabled={selectedGroupSeatIds.length !== effectiveGroupSeatCount} onClick={handleGroupReservation}>Grup için 15 dk ayır <ArrowRight size={15} /></button><span className="group-reservation-hint">QR girişini 15 dakika içinde tamamlamazsanız koltuklar tekrar boşalır.</span></section>
                  </>}
                  {selectedSeat.status === 'reserved' && selectedSeat.studentNumber === studentNumber && <div className="action-stack"><button className="primary-action" type="button" onClick={() => { if (!validateEstimatedLeaveTime()) return; setScannerMessage(''); setScannerMode('reservation'); setScannerOpen(true) }}><ScanLine size={17} /> Masa QR’ını okut <ArrowRight size={16} /></button><span className="action-footnote"><ShieldCheck size={13} /> 15 dk içinde masadaki QR’ı tarayarak girişini doğrula.</span><button className="secondary-action cancel-reservation-action" type="button" onClick={() => cancelReservation(selectedSeat)}><X size={15} /> Rezervasyonu iptal et</button></div>}
                  {selectedSeat.status === 'reserved' && selectedSeat.studentNumber !== studentNumber && <div className="action-stack other-student-reserved"><div className="other-reservation-badge"><Clock3 size={16} /><span>Bu masa başka bir öğrenci adına rezerve edilmiştir.</span></div><span className="action-footnote"><ShieldCheck size={13} /> 15 dakika içinde QR ile giriş yapılmazsa otomatik olarak boşa düşer.</span></div>}
                  {selectedSeat.status === 'occupied' && selectedSeat.studentNumber === studentNumber && <div className="action-stack"><button className="primary-action receipt-action" type="button" onClick={() => setReceiptSeatId(selectedSeat.id)}><ReceiptText size={17} /> E-fişimi göster <ArrowRight size={16} /></button><button className="secondary-action" type="button" onClick={() => toggleBreak(selectedSeat)}><Clock3 size={16} /> {selectedSeat.breakStartedAt ? 'Moladan döndüm' : 'Molaya çık'}</button><button className="text-action" type="button" onClick={() => endSession(selectedSeat)}>Oturumu bitir</button></div>}
                  {selectedSeat.status === 'occupied' && selectedSeat.studentNumber !== studentNumber && !selectedSeat.breakStartedAt && <div className="action-stack other-student-occupied"><div className="other-reservation-badge"><UsersRound size={16} /><span>Bu masada şu anda başka bir öğrenci çalışıyor.</span></div></div>}
                  {selectedSeat.status === 'occupied' && selectedSeat.studentNumber !== studentNumber && selectedSeat.breakStartedAt && <div className="action-stack break-report-stack">{selectedBreakReportable ? <button className="secondary-action break-report-action" type="button" disabled={selectedBreakReported} onClick={() => requestBreakReport(selectedSeat)}><Megaphone size={15} /> {selectedBreakReported ? 'Bildirimin alındı' : '20 dakikayı aşan molayı bildir'}</button> : <span className="action-footnote"><Clock3 size={13} /> Bildirim, mola 20 dakikayı aşınca açılır.</span>}</div>}
                  {selectedSeat.status !== 'available' && selectedSeat.studentNumber !== studentNumber && <div className="quiet-notice"><ShieldCheck size={15} /> Öğrenci bilgileri gizli tutulur.</div>}
                </>
              ) : <div className="empty-detail">Devam etmek için haritadan bir masa seç.</div>}
              <div className="desk-help"><span className="help-dot"><Info size={14} /></span><span>Masanın QR kodunu okut<strong>Oturma onayı masadaki QR taranınca tamamlanır.</strong></span></div>
            </aside>
          </div>}
          {activeView === 'leaderboard' && <section className="leaderboard-view" aria-labelledby="leaderboard-title">
            <header className="leaderboard-heading">
              <div><span className="section-kicker">BUGÜN · {todayLabel.toLocaleUpperCase('tr-TR')}</span><h2 id="leaderboard-title">Çalışma sıralaması</h2><p>Aktif ve tamamlanan masa oturumlarının toplamı.</p></div>
              <div className="leaderboard-total"><span>Toplam çalışma</span><strong>{formatElapsed(leaderboardRows.reduce((total, row) => total + row.duration, 0))}</strong><small>{leaderboardRows.length} öğrenci</small></div>
            </header>
            <div className="leaderboard-grid">
              <section className="ranking-panel" aria-label="Öğrenci sıralaması">
                <div className="ranking-panel-heading"><div><span className="section-kicker">BUGÜNÜN LİSTESİ</span><h3>En uzun çalışanlar</h3></div><span className="ranking-period"><Clock3 size={13} /> Günlük</span></div>
                <div className="ranking-column-head"><span>SIRA</span><span>ÖĞRENCİ</span><span>SÜRE</span></div>
                {leaderboardRows.length > 0 ? leaderboardRows.slice(0, 10).map((row, index) => (
                  <div className={`ranking-row ${index === 0 ? 'top-ranked' : ''}`} key={row.studentNumber}>
                    <span className="rank-number">{index === 0 ? <Trophy size={16} /> : String(index + 1).padStart(2, '0')}</span>
                    <span className="rank-avatar">{getStudentInitials(row.studentNumber)}</span>
                    <div className="rank-student"><strong>{getStudentFullName(row.studentNumber)}</strong><span>{row.active ? 'Şu anda çalışıyor' : 'Oturumunu tamamladı'}</span></div>
                    <strong className="rank-duration">{formatElapsed(row.duration)}</strong>
                  </div>
                )) : <div className="ranking-empty"><Clock3 size={20} /><strong>Bugün henüz oturum yok</strong><span>İlk çalışma oturumu başladığında sıralama burada görünür.</span></div>}
                <div className="ranking-privacy"><ShieldCheck size={14} /> Çalışma sıralaması günlük oturumlara göre listelenir.</div>
              </section>

              <aside className="leaderboard-side">
                <section className="winner-panel">
                  <span className="winner-eyebrow"><Trophy size={14} /> GÜNÜN KAZANANI</span>
                  {leaderboardRows[0] ? <><strong className="winner-name">{formatStudentAlias(leaderboardRows[0].studentNumber)}</strong><span className="winner-caption">{leaderboardRows[0].active ? 'Çalışmaya devam ediyor' : 'Bugünkü toplam çalışma süresi'}</span><span className="winner-duration">{formatElapsed(leaderboardRows[0].duration)}</span></> : <><strong className="winner-name">Henüz belli değil</strong><span className="winner-caption">İlk oturumla birlikte liderlik yarışı başlar.</span></>}
                  <span className="winner-ribbon"><Sparkles size={13} /> İstikrarlı çalışma, güzel sonuçlar getirir.</span>
                </section>
                <section className="announcement-section" aria-labelledby="announcements-title">
                  <div className="announcement-heading"><Megaphone size={16} /><h3 id="announcements-title">Duyurular</h3></div>
                  <div className="announcement-row"><span className="announcement-marker green-marker" /><div><strong>Kütüphane bugün açık</strong><span>Çalışma alanları 22.00’ye kadar kullanılabilir.</span></div></div>
                  <div className="announcement-row"><span className="announcement-marker yellow-marker" /><div><strong>Rezervasyon hatırlatması</strong><span>Ayırdığın masaya 15 dakika içinde QR ile giriş yap.</span></div></div>
                  {leaderboardRows[0] && <div className="announcement-row winner-announcement"><span className="announcement-marker coral-marker" /><div><strong>Günün lideri belli oldu</strong><span>{formatStudentAlias(leaderboardRows[0].studentNumber)} · {formatElapsed(leaderboardRows[0].duration)}</span></div></div>}
                </section>
              </aside>
            </div>
          </section>}

          {activeView === 'exams' && <section className="exams-view" aria-labelledby="exams-title">
            <header className="exams-heading">
              <div>
                <span className="section-kicker">AKADEMİK SINAV TAKVİMİ</span>
                <h2 id="exams-title">Sınav Geri Sayımı</h2>
                <p>Vize ve final sınavlarını kaydet, kalan süreyi saniye saniye canlı geri sayımla izle.</p>
              </div>
              <button
                type="button"
                className="primary-action add-exam-btn"
                onClick={() => {
                  setExamCourseInput('')
                  setExamTypeInput('vize')
                  setExamCustomCategoryInput('')
                  setExamDateInput('')
                  setExamTimeInput('10:00')
                  setExamClassroomInput('')
                  setExamNotesInput('')
                  setExamError('')
                  setAddExamModalOpen(true)
                }}
              >
                <Plus size={16} /> Yeni Sınav Ekle
              </button>
            </header>

            {nearestUpcomingExam ? (
              <div className="exam-hero-card">
                <div className="exam-hero-top">
                  <span className={`exam-type-pill type-${nearestUpcomingExam.type}`}>
                    {formatExamTypeLabel(nearestUpcomingExam.type, nearestUpcomingExam.customCategory)}
                  </span>
                  <span className="exam-hero-urgency">
                    <Clock3 size={14} /> {getExamRemaining(nearestUpcomingExam.date, nearestUpcomingExam.time, now).text}
                  </span>
                </div>

                <div className="exam-hero-body">
                  <div>
                    <span className="exam-hero-kicker">SIRADAKİ EN YAKIN SINAV</span>
                    <h3 className="exam-hero-title">{nearestUpcomingExam.courseName} Sınavı</h3>
                    <div className="exam-hero-meta">
                      <span><Calendar size={14} /> {formatExamFullDate(nearestUpcomingExam.date)}</span>
                      <span><Clock3 size={14} /> Saat {nearestUpcomingExam.time}</span>
                      {nearestUpcomingExam.classroom && <span><Building2 size={14} /> {nearestUpcomingExam.classroom}</span>}
                    </div>
                  </div>

                  <div className="countdown-clock" role="timer" aria-live="polite">
                    <div className="countdown-unit">
                      <span className="countdown-number">{countdownData.days}</span>
                      <span className="countdown-label">GÜN</span>
                    </div>
                    <span className="countdown-colon">:</span>
                    <div className="countdown-unit">
                      <span className="countdown-number">{countdownData.hours}</span>
                      <span className="countdown-label">SAAT</span>
                    </div>
                    <span className="countdown-colon">:</span>
                    <div className="countdown-unit">
                      <span className="countdown-number">{countdownData.minutes}</span>
                      <span className="countdown-label">DAKİKA</span>
                    </div>
                    <span className="countdown-colon">:</span>
                    <div className="countdown-unit">
                      <span className="countdown-number countdown-seconds">{countdownData.seconds}</span>
                      <span className="countdown-label">SANİYE</span>
                    </div>
                  </div>
                </div>

                <div className="exam-hero-footer">
                  <span className="exam-hero-motto">
                    <Sparkles size={14} /> Sınava hazırlık için kütüphanede odaklanarak çalışmaya hemen başlayabilirsin.
                  </span>
                  <button
                    type="button"
                    className="secondary-action"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => setActiveView('map')}
                  >
                    <MapPin size={14} /> Masa Haritasına Dön
                  </button>
                </div>
              </div>
            ) : (
              <div className="exam-hero-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <span className="exam-hero-kicker">YAKLAŞAN SINAV BULUNMADI</span>
                <h3 className="exam-hero-title" style={{ fontSize: '20px', margin: '8px 0' }}>Henüz sınav tarihi girmedin</h3>
                <p style={{ color: '#556c59', fontSize: '13px', margin: '0 0 16px' }}>Vize veya final tarihlerini ekleyerek geri sayımı hemen başlatabilirsin.</p>
                <div>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => {
                      setExamCourseInput('')
                      setExamTypeInput('vize')
                      setExamCustomCategoryInput('')
                      setExamDateInput('')
                      setExamTimeInput('10:00')
                      setExamClassroomInput('')
                      setExamNotesInput('')
                      setExamError('')
                      setAddExamModalOpen(true)
                    }}
                  >
                    <Plus size={16} /> İlk Sınavını Ekle
                  </button>
                </div>
              </div>
            )}

            <div className="exams-list-container">
              <div className="exams-list-header">
                <div className="exam-filter-pills" role="tablist" aria-label="Sınav filtreleri">
                  <button
                    type="button"
                    className={`area-tab ${examFilter === 'all' ? 'selected' : ''}`}
                    onClick={() => setExamFilter('all')}
                  >
                    Tümü ({exams.length})
                  </button>
                  <button
                    type="button"
                    className={`area-tab ${examFilter === 'vize' ? 'selected' : ''}`}
                    onClick={() => setExamFilter('vize')}
                  >
                    Vizeler ({exams.filter((e) => e.type === 'vize').length})
                  </button>
                  <button
                    type="button"
                    className={`area-tab ${examFilter === 'final' ? 'selected' : ''}`}
                    onClick={() => setExamFilter('final')}
                  >
                    Finaller ({exams.filter((e) => e.type === 'final').length})
                  </button>
                  <button
                    type="button"
                    className={`area-tab ${examFilter === 'diger' ? 'selected' : ''}`}
                    onClick={() => setExamFilter('diger')}
                  >
                    Diğer ({exams.filter((e) => e.type === 'diger' || e.type === 'butunleme' || e.type === 'quiz').length})
                  </button>
                </div>
              </div>

              <div className="exams-grid">
                {filteredExams.map((exam) => {
                  const remaining = getExamRemaining(exam.date, exam.time, now)
                  return (
                    <article className="exam-card" key={exam.id}>
                      <div className="exam-card-head">
                        <span className={`exam-type-pill type-${exam.type}`}>
                          {formatExamTypeLabel(exam.type, exam.customCategory)}
                        </span>
                        <button
                          type="button"
                          className="exam-delete-btn"
                          onClick={() => handleDeleteExam(exam.id)}
                          aria-label={`${exam.courseName} sınavını sil`}
                          title="Sınavı sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="exam-card-title-row">
                        <h3 className="exam-card-title">{exam.courseName}</h3>
                        {exam.notes && <p className="exam-card-notes">{exam.notes}</p>}
                      </div>

                      <div className="exam-card-schedule">
                        <div>
                          <Calendar size={14} />
                          <span>{formatExamFullDate(exam.date)}</span>
                        </div>
                        <div>
                          <Clock3 size={14} />
                          <span>Saat {exam.time}</span>
                        </div>
                        {exam.classroom && (
                          <div>
                            <Building2 size={14} />
                            <span>{exam.classroom}</span>
                          </div>
                        )}
                      </div>

                      <div className="exam-card-countdown">
                        <span className="exam-countdown-label">KALAN SÜRE</span>
                        <strong className={`exam-countdown-value ${remaining.isPast ? 'past' : remaining.days <= 3 ? 'urgent' : ''}`}>
                          {remaining.text}
                        </strong>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>}

          {activeView === 'board' && <section className="board-view" aria-labelledby="board-title">
            <header className="board-heading">
              <div>
                <span className="section-kicker">KAMPÜS DİJİTAL DUVARI</span>
                <h2 id="board-title">Kütüphane Panosu & Öğrenci Notları</h2>
                <p>Masada unuttuğun eşyayı sor, bulduğun eşyayı bildir veya ders notu & çalışma soruları paylaş.</p>
              </div>
              <button
                type="button"
                className="primary-action"
                onClick={() => {
                  if (!studentNumber) {
                    setLoginValue('')
                    setLoginError('Kütüphane panosuna not bırakmak için lütfen öğrenci girişi yapın.')
                    setLoginOpen(true)
                    return
                  }
                  setNewNoteCategory('kayip')
                  setNewNoteTitle('')
                  setNewNoteContent('')
                  setNewNoteLocation(`${selectedLocation.name} · ${currentFloorLabel}`)
                  setNewNoteSeatCode(mySeat ? mySeat.code : '')
                  setNewNoteError('')
                  setAddNoteModalOpen(true)
                }}
              >
                <Plus size={16} /> Yeni Not Bırak
              </button>
            </header>

            <div className="board-toolbar">
              <div className="board-filters" role="group" aria-label="Not kategorileri">
                <button
                  type="button"
                  className={`board-filter-btn ${noteCategoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setNoteCategoryFilter('all')}
                >
                  Tümü ({notes.length})
                </button>
                <button
                  type="button"
                  className={`board-filter-btn ${noteCategoryFilter === 'kayip' ? 'active' : ''}`}
                  onClick={() => setNoteCategoryFilter('kayip')}
                >
                  Kayıp Eşya ({notes.filter((n) => n.category === 'kayip').length})
                </button>
                <button
                  type="button"
                  className={`board-filter-btn ${noteCategoryFilter === 'bulundu' ? 'active' : ''}`}
                  onClick={() => setNoteCategoryFilter('bulundu')}
                >
                  Bulunan Eşya ({notes.filter((n) => n.category === 'bulundu').length})
                </button>
                <button
                  type="button"
                  className={`board-filter-btn ${noteCategoryFilter === 'yardim' ? 'active' : ''}`}
                  onClick={() => setNoteCategoryFilter('yardim')}
                >
                  Ders & Yardım ({notes.filter((n) => n.category === 'yardim').length})
                </button>
                <button
                  type="button"
                  className={`board-filter-btn ${noteCategoryFilter === 'genel' ? 'active' : ''}`}
                  onClick={() => setNoteCategoryFilter('genel')}
                >
                  Genel ({notes.filter((n) => n.category === 'genel').length})
                </button>
              </div>

              <div className="board-search-input">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Not, eşya veya kişi ara..."
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface, #ffffff)', border: '1px solid var(--border, #e3ede1)', borderRadius: '12px' }}>
                <MessageSquare size={36} style={{ color: '#8fa593', margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: 'inherit' }}>Uygun not veya duyuru bulunamadı</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted, #556c59)' }}>Bu filtrede henüz not bırakılmamış. İlk notu sen bırakabilirsin.</p>
                <button
                  type="button"
                  className="primary-action"
                  style={{ margin: '0 auto' }}
                  onClick={() => {
                    if (!studentNumber) {
                      setLoginValue('')
                      setLoginError('Kütüphane panosuna not bırakmak için lütfen öğrenci girişi yapın.')
                      setLoginOpen(true)
                      return
                    }
                    setNewNoteCategory('kayip')
                    setNewNoteTitle('')
                    setNewNoteContent('')
                    setNewNoteLocation(`${selectedLocation.name} · ${currentFloorLabel}`)
                    setNewNoteSeatCode(mySeat ? mySeat.code : '')
                    setNewNoteError('')
                    setAddNoteModalOpen(true)
                  }}
                >
                  <Plus size={15} /> Yeni Not Bırak
                </button>
              </div>
            ) : (
              <div className="board-grid">
                {filteredNotes.map((note) => {
                  const isAuthor = studentNumber === note.studentNumber
                  return (
                    <article className={`board-card ${note.isResolved ? 'resolved-card' : ''}`} key={note.id}>
                      <div className="board-card-head">
                        <div className="board-badges">
                          <span className={`board-category-badge cat-${note.category}`}>
                            <Tag size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                            {formatNoteCategoryLabel(note.category)}
                          </span>
                          {note.isResolved && (
                            <span className="board-resolved-badge">
                              <CheckCircle2 size={12} /> Çözüldü
                            </span>
                          )}
                        </div>
                        <div className="board-location-tag">
                          <MapPin size={12} /> {note.locationName} {note.seatCode ? `· Masa ${note.seatCode}` : ''}
                        </div>
                      </div>

                      <h3 className="board-card-title">{note.title}</h3>
                      <p className="board-card-content">{note.content}</p>

                      <div className="board-card-author-bar">
                        <div className="board-author-info">
                          <span className="board-author-avatar">{getStudentInitials(note.studentNumber)}</span>
                          <div>
                            <strong className="board-author-name">{note.studentName}</strong>
                            <span className="board-card-date"> · {formatTimeAgo(note.createdAt, now)}</span>
                          </div>
                        </div>

                        <div className="board-card-actions">
                          <button
                            className="board-resolve-btn"
                            type="button"
                            onClick={() => handleToggleResolved(note.id)}
                            title={note.isResolved ? 'Aktife al' : 'Çözüldü olarak işaretle'}
                          >
                            <CheckCircle2 size={13} />
                            <span>{note.isResolved ? 'Geri Al' : 'Çözüldü'}</span>
                          </button>
                          {isAuthor && (
                            <button
                              className="board-delete-btn"
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              aria-label="Notu sil"
                              title="Notu sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="board-comments-section">
                        <div className="board-comments-title">
                          <span>
                            <MessageSquare size={13} /> YORUMLAR ({note.comments.length})
                          </span>
                          <span>
                            {note.comments.length > 0
                              ? `Son mesaj ${formatTimeAgo(note.comments[note.comments.length - 1].createdAt, now)}`
                              : 'İlk yorumu yazın'}
                          </span>
                        </div>

                        {note.comments.length > 0 && (
                          <div className="board-comment-list">
                            {note.comments.map((comment) => {
                              const isCommentAuthor = studentNumber === comment.studentNumber
                              return (
                                <div className="board-comment-item" key={comment.id}>
                                  <div className="board-comment-meta">
                                    <div className="board-comment-author-wrap">
                                      <strong className="board-comment-author">{comment.studentName}</strong>
                                      <span className="board-comment-time"> · {formatTimeAgo(comment.createdAt, now)}</span>
                                    </div>
                                    {isCommentAuthor && (
                                      <button
                                        type="button"
                                        className="board-comment-delete-btn"
                                        onClick={() => handleDeleteComment(note.id, comment.id)}
                                        aria-label="Yorumumu sil"
                                        title="Yorumumu sil"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="board-comment-text">{comment.content}</p>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <form
                          className="board-comment-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleAddComment(note.id)
                          }}
                        >
                          <input
                            className="board-comment-input"
                            type="text"
                            placeholder={
                              studentNumber
                                ? 'Yorum yaz... (örn. Evet masada gördüm, danışmaya bıraktım)'
                                : 'Yorum yazmak için öğrenci girişi yapın'
                            }
                            value={commentInputs[note.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [note.id]: e.target.value }))
                            }
                          />
                          <button
                            className="board-comment-submit"
                            type="submit"
                            disabled={!(commentInputs[note.id] || '').trim()}
                          >
                            <Send size={13} /> Yanıtla
                          </button>
                        </form>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>}

          {activeView === 'ai' && (
            <AiAssistantView
              seats={seats}
              onNavigateToMap={() => setActiveView('map')}
              studentNumber={studentNumber || undefined}
            />
          )}

          <footer className="page-footer">
            <span>© 2026 Kampüs Masa · <strong>by Aksoy</strong></span>
            <a
              className="footer-feedback-link"
              href="mailto:esa94tokat@gmail.com?subject=Kampus%20Masa%20Geri%20Bildirim"
              title="Geri bildirim gönder: esa94tokat@gmail.com"
            >
              <Mail size={12} /> esa94tokat@gmail.com
            </a>
            <span className="prototype-label"><span /> PROTOTİP</span>
          </footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Bildirimi kapat"><X size={15} /></button></div>}

      {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false) }}>
        <section className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <button className="dialog-close" type="button" onClick={() => setLoginOpen(false)} aria-label="Kapat"><X size={18} /></button>
          <span className="dialog-icon"><KeyRound size={20} /></span><span className="section-kicker">KAMPÜS HESABI</span><h2 id="login-title">Öğrenci girişi</h2><p>Rezervasyon ve masa fişin için öğrenci numaranla devam et.</p>
          <form onSubmit={handleLogin}>
            <label className="input-label" htmlFor="student-number">Öğrenci numarası</label>
            <input id="student-number" className="student-input" value={loginValue} onChange={(event) => { setLoginValue(event.target.value.replace(/\D/g, '').slice(0, 12)); setLoginError('') }} placeholder="Öğrenci numaranızı girin" inputMode="numeric" autoFocus />

            <label className="input-label" htmlFor="student-password" style={{ marginTop: '12px' }}>Şifre</label>
            <input id="student-password" type="password" className="student-input" value={loginPassword} onChange={(event) => { setLoginPassword(event.target.value); setLoginError('') }} placeholder="Şifrenizi girin" autoComplete="current-password" />

            {loginError && <span className="form-error">{loginError}</span>}
            <button className="primary-action modal-submit" type="submit">Giriş yap <ArrowRight size={16} /></button>
          </form>
          <div className="login-assurance"><ShieldCheck size={15} /><span>Giriş öğrenci bilgi sistemi üzerinden doğrulanır.</span></div>
        </section>
      </div>}

      {scannerOpen && selectedSeat && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false) }}>
        <section className="dialog scanner-dialog" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
          <button className="dialog-close" type="button" onClick={() => setScannerOpen(false)} aria-label="Kapat"><X size={18} /></button>
          <span className="dialog-icon scan-dialog-icon"><ScanLine size={21} /></span><span className="section-kicker">{selectedLocation.name.toLocaleUpperCase('tr-TR')} · MASA {selectedSeat.code}</span><h2 id="scanner-title">QR kodunu tara</h2><p>{scannerMode === 'reservation' ? 'Rezervasyonunu doğrulamak için masanın QR kodunu kamerayla okut.' : 'Oturduğun masayı onaylamak için üzerindeki QR kodunu kamerayla okut.'}</p>
          <div className="scanner-frame"><div id="qr-reader" /><div className="scanner-target"><span /></div></div>
          {scannerMessage && <div className="scanner-message" role="status"><Info size={15} />{scannerMessage}</div>}
          <button className="demo-scan" type="button" onClick={() => scannerMode && completeCheckIn(selectedSeat.id, scannerMode)}><ScanLine size={15} /> Demo: QR okutuldu</button>
          <span className="scanner-caption">Kamera izni bu sayfada kullanılır, görüntü kaydedilmez.</span>
        </section>
      </div>}

      {receiptSeat && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReceiptSeatId(null) }}>
        <section className="dialog receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
          <button className="dialog-close" type="button" onClick={() => setReceiptSeatId(null)} aria-label="Kapat"><X size={18} /></button>
          <div className="receipt-topline"><span className="receipt-brand-mark"><img src="/logo.png" alt="Logo" className="brand-logo-img" /></span><div className="receipt-brand-copy"><strong>KAMPÜS MASA</strong><span>DİJİTAL KÜTÜPHANE BELGESİ</span></div><span className="receipt-live"><i /> OTURUM AKTİF</span></div>
          <div className="receipt-document-head"><div><span className="section-kicker">MASA KULLANIM FİŞİ</span><h2 id="receipt-title">Oturum onaylandı</h2><p>{locations.find((location) => location.id === receiptSeat.locationId)?.name} · {receiptSeat.table}</p></div><div className="receipt-number-box"><span>FİŞ NUMARASI</span><strong>{receiptSeat.receiptCode ?? '—'}</strong></div></div>
          <div className="receipt-content"><div className="receipt-details"><div className="receipt-detail-row"><span>ÖĞRENCİ NUMARASI</span><strong>{receiptSeat.studentNumber ?? '—'}</strong></div><div className="receipt-detail-row"><span>MASA</span><strong>{receiptSeat.code} · {receiptSeat.area}</strong></div><div className="receipt-detail-row"><span>GİRİŞ SAATİ</span><strong>{formatClock(receiptSeat.checkedInAt)}</strong></div><div className="receipt-detail-row"><span>OTURUM SÜRESİ</span><strong>{formatDuration(receiptSeat.checkedInAt, now)}</strong></div><div className="receipt-detail-row"><span>TAHMİNİ ÇIKIŞ</span><strong>{receiptSeat.estimatedLeaveAt || 'Belirtilmedi'}</strong></div></div><div className="receipt-qr"><QRCodeSVG value={`KUTUPHANE-FIS:${receiptSeat.receiptCode ?? receiptSeat.id}`} size={120} level="Q" includeMargin /><strong>QR DOĞRULAMA</strong><span>Bu fiş, aktif masa oturumuna özeldir.</span></div></div>
          <div className="receipt-status-band"><span className="receipt-status-icon"><ShieldCheck size={17} /></span><div><strong>Masa kullanımı doğrulandı</strong><span>Görevliye göstermek için bu belgeyi açık tutabilir veya PDF indirebilirsin.</span></div><span className="receipt-live"><i /> GEÇERLİ</span></div>
          <div className="receipt-actions"><a className={`primary-action pdf-action ${receiptPdfUrl ? '' : 'pdf-pending'}`} href={receiptPdfUrl ?? undefined} download={`kampus-masa-${receiptSeat.locationId}-${receiptSeat.code.toLowerCase()}-fis.pdf`} aria-disabled={!receiptPdfUrl} onClick={(event) => { if (!receiptPdfUrl) event.preventDefault() }}><FileDown size={17} /> {receiptPdfUrl ? 'PDF olarak indir' : receiptPdfError ? 'PDF hazırlanamadı' : 'PDF hazırlanıyor'}</a><button className="secondary-action" type="button" onClick={() => setReceiptSeatId(null)}>Kapat</button></div>
          {receiptPdfError && <span className="receipt-pdf-error" role="alert">{receiptPdfError}</span>}
          <div className="receipt-footnote"><ShieldCheck size={14} /> Fiş, oturum kapanana kadar geçerlidir.</div>
        </section>
      </div>}

      {helpOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false)
          }}
        >
          <section
            className="dialog help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setHelpOpen(false)}
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
            <span className="dialog-icon help-dialog-icon">
              <CircleHelp size={22} />
            </span>
            <span className="section-kicker">KÜTÜPHANE VE DANIŞMA</span>
            <h2 id="help-title">İletişim ve Destek</h2>
            <p>
              Masa kullanımı, kütüphane işlemleri ve teknik destek için
              aşağıdaki resmi iletişim kanallarından ulaşabilirsiniz.
            </p>

            <div className="help-contact-cards">
              <div className="help-contact-card">
                <span className="help-contact-label">KURUMSAL BİLGİ VE ADRES</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Building2 size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--brand-primary, #2e6047)' }} />
                  <div>
                    <strong>Gebze Teknik Üniversitesi Rektörlüğü</strong>
                    <address className="help-contact-address">
                      41400, Gebze / KOCAELİ
                    </address>
                  </div>
                </div>
              </div>

              <div className="help-contact-grid">
                <a
                  className="help-contact-item"
                  href="tel:+902626051000"
                  title="Santrali Ara"
                >
                  <span className="help-item-label">TELEFON</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ color: 'var(--brand-primary, #2e6047)' }} />
                    <strong>(262) 605 10 00</strong>
                  </div>
                </a>

                <div className="help-contact-item">
                  <span className="help-item-label">FAKS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Printer size={14} style={{ color: 'var(--brand-primary, #2e6047)' }} />
                    <strong>(262) 653 84 90</strong>
                  </div>
                </div>
              </div>

              <a
                className="help-contact-item"
                href="mailto:gtu@hs01.kep.tr"
                title="KEP Adresi"
              >
                <span className="help-item-label">KAYITLI ELEKTRONİK POSTA (KEP)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} style={{ color: 'var(--brand-primary, #2e6047)' }} />
                  <strong className="help-contact-link">gtu@hs01.kep.tr</strong>
                </div>
              </a>
            </div>

            <div className="help-feedback-card">
              <div className="help-feedback-head">
                <Sparkles size={16} style={{ color: 'var(--brand-primary, #2e6047)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Proje & Geliştirici</strong>
                  <span className="help-feedback-author">Aksoy tarafından üretildi (by Aksoy)</span>
                </div>
              </div>
              <p className="help-feedback-text">
                Görüş, öneri ve geri bildirimleriniz için doğrudan e-posta iletebilirsiniz:
              </p>
              <a
                className="help-feedback-email-btn"
                href="mailto:esa94tokat@gmail.com?subject=Kampus%20Masa%20Geri%20Bildirim"
              >
                <Mail size={13} /> esa94tokat@gmail.com
              </a>
            </div>

            <div className="help-dialog-footer">
              <span>© Gebze Teknik Üniversitesi Rektörlüğü</span>
              <button
                type="button"
                className="secondary-action"
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setHelpOpen(false)}
              >
                Kapat
              </button>
            </div>
          </section>
        </div>
      )}

      {addExamModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAddExamModalOpen(false)
          }}
        >
          <section
            className="dialog exam-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-exam-title"
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setAddExamModalOpen(false)}
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
            <span className="dialog-icon exam-dialog-icon">
              <Calendar size={20} />
            </span>
            <span className="section-kicker">AKADEMİK PLANLAMA</span>
            <h2 id="add-exam-title">Yeni Sınav Ekle</h2>
            <p>Dersini ve sınav tarihini gir, sistem kalan süreyi otomatik olarak geri saysın.</p>

            <form onSubmit={handleSaveExam}>
              <label className="input-label" htmlFor="exam-course">
                Ders Adı
              </label>
              <input
                id="exam-course"
                className="student-input"
                value={examCourseInput}
                onChange={(e) => {
                  setExamCourseInput(e.target.value)
                  setExamError('')
                }}
                placeholder="Örn. Türkçe, Yazılım Projesi, Fizik Sunumu"
                autoFocus
              />

              <label className="input-label" style={{ marginTop: '12px' }}>
                Etkinlik / Sınav Türü
              </label>
              <div className="exam-type-toggle" role="group" aria-label="Sınav veya etkinlik türü">
                {(['vize', 'final', 'butunleme', 'quiz', 'diger'] as ExamType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`exam-type-btn ${examTypeInput === t ? 'active' : ''} type-${t}`}
                    onClick={() => setExamTypeInput(t)}
                  >
                    {t === 'vize' ? 'Vize' : t === 'final' ? 'Final' : t === 'butunleme' ? 'Bütünleme' : t === 'quiz' ? 'Quiz' : 'Diğer'}
                  </button>
                ))}
              </div>

              {examTypeInput === 'diger' && (
                <div style={{ marginTop: '10px' }}>
                  <label className="input-label" htmlFor="exam-custom-category">
                    Kategori / Tür Belirt (İsteğe bağlı)
                  </label>
                  <input
                    id="exam-custom-category"
                    className="student-input"
                    value={examCustomCategoryInput}
                    onChange={(e) => setExamCustomCategoryInput(e.target.value)}
                    placeholder="Örn. Sunum, Ödev, Proje Teslimi, Laboratuvar..."
                  />
                </div>
              )}

              <div className="exam-datetime-grid" style={{ marginTop: '12px' }}>
                <div>
                  <label className="input-label" htmlFor="exam-date">
                    Sınav Tarihi
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    className="student-input exam-date-input"
                    value={examDateInput}
                    onChange={(e) => {
                      setExamDateInput(e.target.value)
                      setExamError('')
                    }}
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="exam-time">
                    Sınav Saati
                  </label>
                  <input
                    id="exam-time"
                    type="time"
                    className="student-input exam-time-input"
                    value={examTimeInput}
                    onChange={(e) => {
                      setExamTimeInput(e.target.value)
                      setExamError('')
                    }}
                  />
                </div>
              </div>

              <label className="input-label" htmlFor="exam-classroom" style={{ marginTop: '12px' }}>
                Derslik / Sınav Salonu (İsteğe bağlı)
              </label>
              <input
                id="exam-classroom"
                className="student-input"
                value={examClassroomInput}
                onChange={(e) => setExamClassroomInput(e.target.value)}
                placeholder="Örn. Amfi 1, Derslik B-204"
              />

              <label className="input-label" htmlFor="exam-notes" style={{ marginTop: '12px' }}>
                Notlar / Konular (İsteğe bağlı)
              </label>
              <input
                id="exam-notes"
                className="student-input"
                value={examNotesInput}
                onChange={(e) => setExamNotesInput(e.target.value)}
                placeholder="Örn. 1. ve 4. bölümler arası"
              />

              {examError && <span className="form-error">{examError}</span>}

              <div className="exam-dialog-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button className="primary-action modal-submit" type="submit" style={{ flex: 1 }}>
                  <Plus size={16} /> Sınavı Kaydet
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setAddExamModalOpen(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {addNoteModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddNoteModalOpen(false)
          }}
        >
          <section
            className="dialog note-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setAddNoteModalOpen(false)}
              aria-label="Kapat"
            >
              <X size={18} />
            </button>

            <span className="dialog-icon note-dialog-icon">
              <MessageSquare size={21} />
            </span>
            <span className="section-kicker">KÜTÜPHANE DİJİTAL PANOSU</span>
            <h2 id="note-modal-title">Yeni Not & Duyuru Bırak</h2>
            <p>Kayıp eşya, bulduğun bir materyal veya ders yardımlaşma notunu panoda paylaş.</p>

            <form onSubmit={handleSaveNote}>
              <label className="input-label">Not Kategorisi</label>
              <div className="note-category-selector" role="group" aria-label="Not kategorisi seç">
                <button
                  type="button"
                  className={`note-cat-choice ${newNoteCategory === 'kayip' ? 'active' : ''}`}
                  onClick={() => setNewNoteCategory('kayip')}
                >
                  Kayıp Eşya
                </button>
                <button
                  type="button"
                  className={`note-cat-choice ${newNoteCategory === 'bulundu' ? 'active' : ''}`}
                  onClick={() => setNewNoteCategory('bulundu')}
                >
                  Bulunan Eşya
                </button>
                <button
                  type="button"
                  className={`note-cat-choice ${newNoteCategory === 'yardim' ? 'active' : ''}`}
                  onClick={() => setNewNoteCategory('yardim')}
                >
                  Ders & Yardım
                </button>
                <button
                  type="button"
                  className={`note-cat-choice ${newNoteCategory === 'genel' ? 'active' : ''}`}
                  onClick={() => setNewNoteCategory('genel')}
                >
                  Genel
                </button>
              </div>

              <label className="input-label" htmlFor="note-title-input" style={{ marginTop: '14px' }}>
                Başlık
              </label>
              <input
                id="note-title-input"
                type="text"
                className="student-input"
                placeholder="Örn: Siyah Sony kulaklık kutusu masada unutuldu"
                value={newNoteTitle}
                onChange={(e) => {
                  setNewNoteTitle(e.target.value)
                  setNewNoteError('')
                }}
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                <div>
                  <label className="input-label" htmlFor="note-location-input">
                    Konum / Alan
                  </label>
                  <input
                    id="note-location-input"
                    type="text"
                    className="student-input"
                    placeholder="Örn: Merkez Kütüphane · 1. Kat"
                    value={newNoteLocation}
                    onChange={(e) => setNewNoteLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="note-seat-input">
                    Masa Kodu (İsteğe bağlı)
                  </label>
                  <input
                    id="note-seat-input"
                    type="text"
                    className="student-input"
                    placeholder="Örn: P-03 veya G-02"
                    value={newNoteSeatCode}
                    onChange={(e) => setNewNoteSeatCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <label className="input-label" htmlFor="note-content-input" style={{ marginTop: '12px' }}>
                Açıklama / Mesaj Detayı
              </label>
              <textarea
                id="note-content-input"
                className="note-textarea"
                rows={3}
                placeholder="Detaylı bilgi verin (nerede gördünüz, nereye bıraktınız veya nasıl iletişime geçilebilir)..."
                value={newNoteContent}
                onChange={(e) => {
                  setNewNoteContent(e.target.value)
                  setNewNoteError('')
                }}
              />

              {newNoteError && <span className="form-error">{newNoteError}</span>}

              <div className="exam-dialog-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button className="primary-action modal-submit" type="submit" style={{ flex: 1 }}>
                  <Plus size={16} /> Notu Panoya Ekle
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setAddNoteModalOpen(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default KampusMasaPage

