import { useState, useEffect } from 'react'
import type { Holiday } from '../types'

// A Coruña local holidays that the Nager.Date API doesn't cover (municipality level)
const ACORUNA_LOCAL: Array<{ month: number; day: number; name: string }> = [
  { month: 8, day: 2, name: 'María Pita (A Coruña)' },
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

  // Add A Coruña local holidays
  for (const local of ACORUNA_LOCAL) {
    const mm = String(local.month).padStart(2, '0')
    const dd = String(local.day).padStart(2, '0')
    holidays.push({ date: `${year}-${mm}-${dd}`, name: local.name, type: 'local' })
  }

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
