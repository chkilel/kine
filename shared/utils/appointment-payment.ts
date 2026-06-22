/**
 * ================================================================
 * Appointment payment derivation helpers
 * ================================================================
 * "Completed" used to be a stored status, but it duplicated state already
 * available via payments. It is now DERIVED: an appointment is considered
 * completed (i.e. fully done and paid) when:
 *   - status is 'finished' (clinical session ended), AND
 *   - paidCents >= priceCents (cached on the appointment row, maintained
 *     by payment create/void endpoints)
 *
 * Use these helpers instead of checking `status === 'completed'`.
 */

type PaidAppointment = {
  status: string
  paidCents: number | null | undefined
  priceCents: number | null | undefined
}

/**
 * Returns true when an appointment has been fully paid for.
 * Requires status === 'finished' AND paidCents >= priceCents.
 */
export function isAppointmentPaid(apt: PaidAppointment): boolean {
  if (apt.status !== 'finished') return false
  const paid = apt.paidCents ?? 0
  const price = apt.priceCents ?? 0
  return price > 0 && paid >= price
}

/**
 * Returns true when an appointment has received at least one payment
 * but is not yet fully paid (partial payment).
 */
export function isAppointmentPartiallyPaid(apt: PaidAppointment): boolean {
  const paid = apt.paidCents ?? 0
  const price = apt.priceCents ?? 0
  return paid > 0 && paid < price
}

/**
 * Returns true when an appointment is "done" from a clinical perspective,
 * regardless of payment. This replaces the old `['finished', 'completed']` union.
 */
export function isAppointmentSessionDone(apt: { status: string }): boolean {
  return apt.status === 'finished'
}
