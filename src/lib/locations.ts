// ── Easter helpers ─────────────────────────────────────────────

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
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function toDateStr(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function easterOffset(year: number, days: number): string {
  const d = easterSunday(year)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

// Martes de Carnaval = Easter - 47 days
function martesCarnival(year: number): string {
  return easterOffset(year, -47)
}

// Corpus Christi = Easter + 60 days
function corpusChristi(year: number): string {
  return easterOffset(year, 60)
}

// San Roque (Vigo) = Aug 16, moved to Monday if it falls on weekend
function sanRoque(year: number): string {
  const d = new Date(year, 7, 16) // Aug 16
  const dow = d.getDay()
  if (dow === 6) d.setDate(18)      // Saturday → Monday
  else if (dow === 0) d.setDate(17) // Sunday  → Monday
  return toDateStr(d)
}

// ── Types ──────────────────────────────────────────────────────

export type LocationKey =
  | 'a_coruna'
  | 'vigo'
  | 'barcelona'
  | 'madrid'
  | 'gijon'
  | 'oviedo'
  | 'sevilla'
  | 'badajoz'
  | 'las_palmas'
  | 'malaga'
  | 'valencia'
  | 'vitoria'
  | 'warsaw'

export interface LocationConfig {
  label: string
  countryCode: string   // ISO 3166-1 alpha-2: 'ES', 'PL', …
  communityCode?: string // ES autonomous community: 'ES-GA', 'ES-CT', …
  fixedLocals: Array<{ month: number; day: number; name: string }>
  computedLocals: Array<(year: number) => { date: string; name: string }>
}

// ── Location registry ──────────────────────────────────────────

export const LOCATIONS: Record<LocationKey, LocationConfig> = {
  a_coruna: {
    label: 'A Coruña',
    countryCode: 'ES',
    communityCode: 'ES-GA',
    fixedLocals: [
      { month: 6, day: 24, name: 'San Juan (A Coruña)' },
    ],
    computedLocals: [
      year => ({ date: martesCarnival(year), name: 'Martes de Carnaval (A Coruña)' }),
    ],
  },

  vigo: {
    label: 'Vigo',
    countryCode: 'ES',
    communityCode: 'ES-GA',
    fixedLocals: [
      { month: 6, day: 24, name: 'San Juan (Vigo)' },
      { month: 3, day: 28, name: 'Reconquista de Vigo' },
    ],
    computedLocals: [
      year => ({ date: sanRoque(year), name: 'San Roque (Vigo)' }),
    ],
  },

  barcelona: {
    label: 'Barcelona',
    countryCode: 'ES',
    communityCode: 'ES-CT',
    fixedLocals: [
      { month: 9, day: 24, name: 'La Mercè (Barcelona)' },
    ],
    computedLocals: [],
  },

  madrid: {
    label: 'Madrid',
    countryCode: 'ES',
    communityCode: 'ES-MD',
    fixedLocals: [
      { month: 5, day: 15, name: 'San Isidro (Madrid)' },
      { month: 11, day: 9,  name: 'La Almudena (Madrid)' },
    ],
    computedLocals: [],
  },

  gijon: {
    label: 'Gijón',
    countryCode: 'ES',
    communityCode: 'ES-AS',
    fixedLocals: [
      // TODO: Begoña — date pending confirmation
    ],
    computedLocals: [
      year => ({ date: martesCarnival(year), name: 'Antroxu (Gijón)' }),
    ],
  },

  oviedo: {
    label: 'Oviedo',
    countryCode: 'ES',
    communityCode: 'ES-AS',
    fixedLocals: [
      // TODO: Martes de Campo — date/formula pending confirmation
      // TODO: San Mateo — date pending (possibly Sep 21)
    ],
    computedLocals: [],
  },

  sevilla: {
    label: 'Sevilla',
    countryCode: 'ES',
    communityCode: 'ES-AN',
    fixedLocals: [
      // TODO: San Fernando — date pending (possibly May 30)
    ],
    computedLocals: [
      year => ({ date: corpusChristi(year), name: 'Corpus Christi (Sevilla)' }),
    ],
  },

  badajoz: {
    label: 'Badajoz',
    countryCode: 'ES',
    communityCode: 'ES-EX',
    fixedLocals: [
      { month: 6, day: 24, name: 'San Juan (Badajoz)' },
      // TODO: 2nd local municipal — pending confirmation
    ],
    computedLocals: [],
  },

  las_palmas: {
    label: 'Las Palmas de Gran Canaria',
    countryCode: 'ES',
    communityCode: 'ES-CN',
    fixedLocals: [
      { month: 9, day: 8, name: 'Ntra. Sra. del Pino (Gran Canaria)' },
      // TODO: 2 locales municipales — pending confirmation
    ],
    computedLocals: [],
  },

  malaga: {
    label: 'Málaga',
    countryCode: 'ES',
    communityCode: 'ES-AN',
    fixedLocals: [
      { month: 2, day: 19, name: 'Toma de Málaga' },
    ],
    computedLocals: [
      year => ({ date: martesCarnival(year), name: 'Martes de Carnaval (Málaga)' }),
    ],
  },

  warsaw: {
    label: 'Varsovia (Polonia)',
    countryCode: 'PL',
    communityCode: undefined,
    fixedLocals: [
      { month: 8, day: 1, name: 'Alzamiento de Varsovia' },
    ],
    computedLocals: [],
  },

  valencia: {
    label: 'Valencia',
    countryCode: 'ES',
    communityCode: 'ES-VC',
    fixedLocals: [
      { month: 3, day: 19, name: 'San José / Las Fallas (Valencia)' },
    ],
    computedLocals: [],
  },

  vitoria: {
    label: 'Vitoria-Gasteiz',
    countryCode: 'ES',
    communityCode: 'ES-PV',
    fixedLocals: [
      { month: 8, day: 5, name: 'Virgen Blanca (Vitoria)' },
    ],
    computedLocals: [],
  },
}

// Sorted list for UI selects
export const LOCATION_OPTIONS: Array<{ value: LocationKey; label: string }> =
  (Object.entries(LOCATIONS) as [LocationKey, LocationConfig][])
    .map(([value, cfg]) => ({ value, label: cfg.label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
