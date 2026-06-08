import { useState, useEffect } from 'react'
import type { Holiday } from '../types'
import { LOCATIONS, type LocationKey } from '../lib/locations'

interface RawHoliday {
  date: string
  localName: string
  global: boolean
  counties: string[] | null
}

// Cache keyed by `${countryCode}-${year}`
const rawCache = new Map<string, RawHoliday[]>()

async function fetchRaw(countryCode: string, year: number): Promise<RawHoliday[]> {
  const key = `${countryCode}-${year}`
  if (rawCache.has(key)) return rawCache.get(key)!
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
  if (!res.ok) throw new Error(`Error fetching ${countryCode} holidays for ${year}`)
  const data: RawHoliday[] = await res.json()
  rawCache.set(key, data)
  return data
}

export function buildHolidays(
  activeCities: LocationKey[],
  years: number[],
): Holiday[] {
  const result: Holiday[] = []
  const seen = new Set<string>()

  const add = (h: Holiday) => {
    const key = `${h.date}||${h.name}||${h.countryCode}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(h)
    }
  }

  const activeCountries = new Set(activeCities.map(c => LOCATIONS[c].countryCode))
  const activeCommunities = new Set(
    activeCities.map(c => LOCATIONS[c].communityCode).filter(Boolean) as string[]
  )

  // Nationals + regionals from API
  for (const countryCode of activeCountries) {
    for (const year of years) {
      const raw = rawCache.get(`${countryCode}-${year}`) ?? []
      for (const item of raw) {
        if (item.global) {
          add({ date: item.date, name: item.localName, type: 'national', countryCode })
        } else if (item.counties?.some(c => activeCommunities.has(c))) {
          add({ date: item.date, name: item.localName, type: 'regional', countryCode })
        }
      }
    }
  }

  // Hardcoded locals per city
  for (const cityKey of activeCities) {
    const cfg = LOCATIONS[cityKey]
    for (const year of years) {
      for (const loc of cfg.fixedLocals) {
        const mm = String(loc.month).padStart(2, '0')
        const dd = String(loc.day).padStart(2, '0')
        add({ date: `${year}-${mm}-${dd}`, name: loc.name, type: 'local', countryCode: cfg.countryCode })
      }
      for (const compute of cfg.computedLocals) {
        const { date, name } = compute(year)
        add({ date, name, type: 'local', countryCode: cfg.countryCode })
      }
    }
  }

  return result
}

interface UseHolidaysResult {
  holidays: Holiday[]
  loading: boolean
  error: string | null
}

export function useHolidays(activeCities: LocationKey[]): UseHolidaysResult {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable key to detect real changes in the city list
  const citiesKey = [...activeCities].sort().join(',')

  useEffect(() => {
    if (activeCities.length === 0) {
      setHolidays([])
      return
    }

    const currentYear = new Date().getFullYear()
    const years = [currentYear, currentYear + 1]
    const countries = [...new Set(activeCities.map(c => LOCATIONS[c].countryCode))]

    setLoading(true)
    Promise.all(years.flatMap(year => countries.map(cc => fetchRaw(cc, year))))
      .then(() => {
        setHolidays(buildHolidays(activeCities, years))
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading holidays:', err)
        setError('No se pudieron cargar los festivos.')
        setLoading(false)
      })
  }, [citiesKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { holidays, loading, error }
}
