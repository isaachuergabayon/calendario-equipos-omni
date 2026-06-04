import { useState, useEffect } from 'react'
import type { Holiday } from '../types'

// Anonymous Gregorian algorithm for Easter Sunday
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// Martes de Carnaval = Easter Sunday - 47 days
function martesCarnival(year: number): string {
  const easter = easterSunday(year)
  const carnival = new Date(easter)
  carnival.setDate(carnival.getDate() - 47)
  const mm = String(carnival.getMonth() + 1).padStart(2, '0')
  const dd = String(carnival.getDate()).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// A Coruña fixed local holidays not covered by Nager.Date (municipality level)
const ACORUNA_FIXED: Array<{ month: number; day: number; name: string }> = [
  { month: 6, day: 24, name: 'San Juan (A Coruña)' },
]

// In-memory cache to avoid re-fetching on re-renders
const cache = new Map<number, Holiday[]>()

async function fetchHolidaysForYear(year: number): Promise<Holiday[]> {
  if (cache.has(year)) return cache.get(year)!

  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ES`)
  if (!res.ok) throw new Error(`Error fetching holidays for ${year}`)

  const data: Array<{
    date: string
    localName: string
    global: boolean
    counties: string[] | null
  }> = await res.json()

  const holidays: Holiday[] = []

  for (const item of data) {
    if (item.global) {
      holidays.push({ date: item.date, name: item.localName, type: 'national' })
    } else if (item.counties?.includes('ES-GA')) {
      holidays.push({ date: item.date, name: item.localName, type: 'regional' })
    }
  }

  // Fixed local holidays
  for (const local of ACORUNA_FIXED) {
    const mm = String(local.month).padStart(2, '0')
    const dd = String(local.day).padStart(2, '0')
    holidays.push({ date: `${year}-${mm}-${dd}`, name: local.name, type: 'local' })
  }

  // Variable local: Martes de Carnaval (47 days before Easter)
  holidays.push({ date: martesCarnival(year), name: 'Martes de Carnaval (A Coruña)', type: 'local' })

  cache.set(year, holidays)
  return holidays
}

interface UseHolidaysResult {
  holidays: Holiday[]
  nationalDates: Set<string>
  loading: boolean
  error: string | null
}

export function useHolidays(): UseHolidaysResult {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const years = [currentYear, currentYear + 1]

    Promise.all(years.map(fetchHolidaysForYear))
      .then(results => {
        setHolidays(results.flat())
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading holidays:', err)
        setError('No se pudieron cargar los festivos.')
        setLoading(false)
      })
  }, [])

  const nationalDates = new Set(
    holidays.filter(h => h.type === 'national').map(h => h.date)
  )

  return { holidays, nationalDates, loading, error }
}

