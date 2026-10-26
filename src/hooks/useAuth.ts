import { useEffect, useState } from 'react'
import {
  clearStudentNumber,
  readDarkMode,
  readStudentNumber,
  readWeeklyGoal,
  writeDarkMode,
  writeStudentNumber,
  writeWeeklyGoal,
} from '../lib/storage'

export function useAuth() {
  const [studentNumber, setStudentNumber] = useState(readStudentNumber)
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(() => readWeeklyGoal(readStudentNumber()))
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(() => String(readWeeklyGoal(readStudentNumber())))
  const [darkMode, setDarkMode] = useState(readDarkMode)

  useEffect(() => {
    if (studentNumber) writeWeeklyGoal(studentNumber, weeklyGoalHours)
  }, [studentNumber, weeklyGoalHours])

  useEffect(() => {
    writeDarkMode(darkMode)
  }, [darkMode])

  function login(value: string) {
    setStudentNumber(value)
    writeStudentNumber(value)
    const savedGoal = readWeeklyGoal(value)
    setWeeklyGoalHours(savedGoal)
    setWeeklyGoalInput(String(savedGoal))
  }

  function logout() {
    setStudentNumber('')
    clearStudentNumber()
  }

  return {
    studentNumber,
    setStudentNumber,
    login,
    logout,
    weeklyGoalHours,
    setWeeklyGoalHours,
    weeklyGoalInput,
    setWeeklyGoalInput,
    darkMode,
    setDarkMode,
  }
}
