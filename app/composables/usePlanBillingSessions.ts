import { PAYMENT_KEYS } from './usePayment'

type AppointmentsPaymentStatusPage = {
  data: AppointmentWithPaymentStatus[]
  nextCursor: { date: string; id: string } | null
}

/**
 * Non-paginated query that loads ALL billable sessions for a single treatment plan,
 * with payment status info (paidCents, paymentStatus, paymentDetails).
 *
 * Used by the facturation page when a specific plan is selected, so per-plan financials
 * (billed / collected / remaining) are always accurate.
 *
 * For the paginated "all" / "no-plan" modes, see `useAppointmentsPaymentStatus`.
 *
 * Note: this is distinct from `usePlanAppointments` in `useAppointment.ts`, which fetches
 * from `/api/appointments/plan` (no payment info) for the treatment plan tab.
 */
const _usePlanBillingSessions = (
  patientId: MaybeRefOrGetter<string>,
  planId: MaybeRefOrGetter<string | null | undefined>
) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    key: () => [...PAYMENT_KEYS.root, 'plan-sessions', toValue(patientId), toValue(planId) ?? ''],
    query: async () => {
      const resp = await requestFetch<AppointmentsPaymentStatusPage>('/api/appointments/payments', {
        query: {
          patientId: toValue(patientId),
          treatmentPlanId: toValue(planId),
          status: ['finished']
        }
      })
      return resp.data
    },
    enabled: () => !!toValue(patientId) && !!toValue(planId)
  })
}

export const usePlanBillingSessions = _usePlanBillingSessions
