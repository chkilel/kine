import { describe, it, expect } from 'vitest'
import {
  INSURERS_CONFIG,
  INSURER_OPTIONS,
  INSURER_SLUGS,
  getInsurer,
  getInsurerLabel,
  isInsurerSlug,
  type InsurerEntry,
  type InsurerSlug
} from './constants.insurers'

describe('constants-insurers', () => {
  describe('INSURERS_CONFIG', () => {
    it('contains at least 11 kiné-relevant operators', () => {
      expect(INSURER_SLUGS.length).toBeGreaterThanOrEqual(11)
    })

    it('every entry has required fields', () => {
      for (const [slug, entry] of Object.entries(INSURERS_CONFIG)) {
        expect(entry.name).toBeTruthy()
        expect(entry.phone).toBeTruthy()
        expect(entry.address).toBeTruthy()
        expect(entry.city).toBeTruthy()
        expect(typeof entry.isActive).toBe('boolean')
        expect(slug, `slug "${slug}" must be kebab-case`).toMatch(/^[a-z0-9-]+$/)
      }
    })

    it('all shortNames are unique when present', () => {
      const shortNames = (Object.values(INSURERS_CONFIG) as InsurerEntry[])
        .map((e) => e.shortName)
        .filter((s): s is string => Boolean(s))
      const unique = new Set(shortNames)
      expect(unique.size).toBe(shortNames.length)
    })
  })

  describe('INSURER_OPTIONS', () => {
    it('excludes inactive entries', () => {
      const allActive = INSURER_OPTIONS.every((o) => o.isActive)
      expect(allActive).toBe(true)
    })

    it('every option has a slug and label', () => {
      for (const option of INSURER_OPTIONS) {
        expect(option.slug).toBeTruthy()
        expect(option.label).toBeTruthy()
      }
    })

    it('label falls back to name when shortName absent', () => {
      const wafa = INSURER_OPTIONS.find((o) => o.slug === 'wafa-assurance')
      expect(wafa?.label).toBe('Wafa Assurance')
    })

    it('label uses shortName when present', () => {
      const cnops = INSURER_OPTIONS.find((o) => o.slug === 'cnops')
      expect(cnops?.label).toBe('CNOPS')
    })
  })

  describe('getInsurer', () => {
    it('returns entry for known slug', () => {
      const cnss = getInsurer('cnss')
      expect(cnss).not.toBeNull()
      expect(cnss?.shortName).toBe('CNSS')
    })

    it('returns null for unknown slug', () => {
      expect(getInsurer('does-not-exist')).toBeNull()
    })
  })

  describe('getInsurerLabel', () => {
    it('returns shortName when available', () => {
      expect(getInsurerLabel('axa-maroc')).toBe('AXA')
    })

    it('returns full name when shortName absent', () => {
      expect(getInsurerLabel('wafa-assurance')).toBe('Wafa Assurance')
    })
  })

  describe('isInsurerSlug', () => {
    it('returns true for valid slugs', () => {
      expect(isInsurerSlug('cnss')).toBe(true)
      expect(isInsurerSlug('allianz-maroc')).toBe(true)
    })

    it('returns false for invalid slugs', () => {
      expect(isInsurerSlug('fake-insurer')).toBe(false)
      expect(isInsurerSlug('')).toBe(false)
    })

    it('acts as a type guard', () => {
      const value: string = 'mamda'
      if (isInsurerSlug(value)) {
        const _slug: InsurerSlug = value
        expect(_slug).toBe('mamda')
      }
    })
  })
})
