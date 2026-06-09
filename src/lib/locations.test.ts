import { describe, it, expect } from 'vitest'
import { LOCATIONS, LOCATION_OPTIONS } from './locations'

describe('LOCATIONS registry', () => {
  it('contains the expected Spanish cities', () => {
    const keys = Object.keys(LOCATIONS)
    expect(keys).toContain('madrid')
    expect(keys).toContain('sevilla')
    expect(keys).toContain('caceres')
    expect(keys).toContain('oviedo')
    expect(keys).toContain('a_coruna')
    expect(keys).toContain('vigo')
    expect(keys).toContain('barcelona')
  })

  it('each location has a non-empty label and countryCode', () => {
    for (const [, cfg] of Object.entries(LOCATIONS)) {
      expect(cfg.label.length).toBeGreaterThan(0)
      expect(cfg.countryCode.length).toBeGreaterThan(0)
    }
  })

  describe('Madrid', () => {
    it('has San Isidro on May 15', () => {
      expect(LOCATIONS.madrid.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 5, day: 15 }),
      )
    })

    it('has La Almudena on Nov 9', () => {
      expect(LOCATIONS.madrid.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 11, day: 9 }),
      )
    })
  })

  describe('Sevilla', () => {
    it('has San Fernando on May 30', () => {
      expect(LOCATIONS.sevilla.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 5, day: 30 }),
      )
    })

    it('has a computed Corpus Christi', () => {
      expect(LOCATIONS.sevilla.computedLocals.length).toBeGreaterThan(0)
      const result = LOCATIONS.sevilla.computedLocals[0](2025)
      expect(result.name).toMatch(/Corpus/i)
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('Cáceres', () => {
    it('has San Jorge on April 23', () => {
      expect(LOCATIONS.caceres.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 4, day: 23 }),
      )
    })

    it('computes Lunes de la Montaña correctly for 2025', () => {
      // May 1, 2025 is Thursday (getDay=4)
      // First Sunday of May 2025 = May 4
      // Lunes de la Montaña = May 5
      const result = LOCATIONS.caceres.computedLocals[0](2025)
      expect(result.date).toBe('2025-05-05')
      expect(result.name).toMatch(/Monta/i)
    })

    it('computes Lunes de la Montaña correctly for 2026', () => {
      // May 1, 2026 is Friday (getDay=5)
      // First Sunday of May 2026 = May 3
      // Lunes de la Montaña = May 4
      const result = LOCATIONS.caceres.computedLocals[0](2026)
      expect(result.date).toBe('2026-05-04')
    })
  })

  describe('Oviedo', () => {
    it('has San Mateo on September 21', () => {
      expect(LOCATIONS.oviedo.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 9, day: 21 }),
      )
    })
  })

  describe('Warsaw', () => {
    it('has country code PL', () => {
      expect(LOCATIONS.warsaw.countryCode).toBe('PL')
    })

    it('has Alzamiento de Varsovia on Aug 1', () => {
      expect(LOCATIONS.warsaw.fixedLocals).toContainEqual(
        expect.objectContaining({ month: 8, day: 1 }),
      )
    })
  })
})

describe('LOCATION_OPTIONS', () => {
  it('has the same count as LOCATIONS', () => {
    expect(LOCATION_OPTIONS.length).toBe(Object.keys(LOCATIONS).length)
  })

  it('is sorted alphabetically (es locale) by label', () => {
    const labels = LOCATION_OPTIONS.map(o => o.label)
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'es'))
    expect(labels).toEqual(sorted)
  })

  it('each option has a non-empty value and label', () => {
    for (const opt of LOCATION_OPTIONS) {
      expect(opt.value.length).toBeGreaterThan(0)
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })
})
