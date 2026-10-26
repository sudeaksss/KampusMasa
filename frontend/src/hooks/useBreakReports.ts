import { useEffect, useState } from 'react'
import type { BreakReport } from '../types'
import { readBreakReports, writeBreakReports } from '../lib/storage'

export function useBreakReports() {
  const [breakReports, setBreakReports] = useState<BreakReport[]>(readBreakReports)

  useEffect(() => {
    writeBreakReports(breakReports)
  }, [breakReports])

  return { breakReports, setBreakReports }
}
