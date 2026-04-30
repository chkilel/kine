import type { Patient } from '../types/patient.types'

// Slugify a string
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Get full name
export function formatFullName(patient: Pick<Patient, 'firstName' | 'lastName'>) {
  return `${patient.firstName} ${patient.lastName}`
}

/**
 * Formats a phone number into a readable format with spaces.
 *
 * @param {string} phone - The phone number to format.
 * @returns {string} The formatted phone number.
 *
 * @example
 * formatPhoneNumber('+212639012345') // → "(+212) 06 39 01 23 45"
 * formatPhoneNumber('0639012345')    // → "06 39 01 23 45"
 */
export function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\s+/g, '')

  // International format: +212639012345 → (+212) 06 39 01 23 45
  const intlMatch = cleaned.match(/^\+(\d{1,3})(\d{9,10})$/)
  if (intlMatch) {
    const [, countryCode, local] = intlMatch
    const localWithZero = '0' + local?.slice(-9)
    const formatted = localWithZero.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    return `(+${countryCode}) ${formatted}`
  }

  // Local format: 0639012345 → 06 39 01 23 45
  const localMatch = cleaned.match(/^0(\d{9})$/)
  if (localMatch) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }

  return phone // Return original if no pattern matches
}
