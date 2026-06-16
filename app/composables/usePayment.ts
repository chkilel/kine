import { createSharedComposable } from '@vueuse/core'
import { APPOINTMENT_KEYS } from './useAppointment'
import { parseISO } from 'date-fns'

// ─── Keys ─────────────────────────────────────────────────────
export const PAYMENT_KEYS = {
  root: ['payments'] as const,
  patientBalance: (patientId: string) => [...PAYMENT_KEYS.root, 'balance', patientId],
  sessionPayments: (sessionId: string) => [...PAYMENT_KEYS.root, 'session', sessionId],
  appointmentPayments: (appointmentId: string) => [...PAYMENT_KEYS.root, 'appointment', appointmentId],
  patientPayments: (patientId: string) => [...PAYMENT_KEYS.root, 'patient', patientId],
  payment: (paymentId: string) => [...PAYMENT_KEYS.root, 'detail', paymentId],
  patientSessionsPaymentStatus: (patientId: string) => [...PAYMENT_KEYS.root, 'sessions-status', patientId],
  patientAppointmentsPaymentStatus: (patientId: string) => [...PAYMENT_KEYS.root, 'appointments-status', patientId]
}

// ─── Types ────────────────────────────────────────────────────
type CreatePaymentParams = {
  paymentData: PaymentRequestBody
}

// ─── Composables ─────────────────────────────────────────────
const _useCreatePayment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ paymentData }: WithOnSuccess<CreatePaymentParams>) => {
      const response = await requestFetch('/api/payments', {
        method: 'POST',
        body: paymentData
      })
      return response?.payment
    },
    onSuccess: (payment, { onSuccess, paymentData }) => {
      onSuccess?.()

      toast.add({
        title: 'Succès',
        description: `Paiement enregistré: ${payment.receiptNumber}`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: PAYMENT_KEYS.root })

      const appointmentId = paymentData.appointmentItems?.[0]?.appointmentId
      if (appointmentId) {
        queryCache.invalidateQueries({ key: PAYMENT_KEYS.appointmentPayments(appointmentId) })
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      }

      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientPayments(paymentData.patientId) })
      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientSessionsPaymentStatus(paymentData.patientId) })
      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientBalance(paymentData.patientId) })
    },
    onError: (error, { onError, paymentData: _paymentData }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de l'enregistrement du paiement").message,
        color: 'error'
      })
    }
  })
}

const _useAppointmentPayments = (appointmentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_KEYS.appointmentPayments(toValue(appointmentId)),
    query: async () => {
      const resp = await requestFetch(`/api/appointments/${toValue(appointmentId)}/payments`)
      return resp
    },
    enabled: () => !!toValue(appointmentId)
  })
}

const _usePatientBalance = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_KEYS.patientBalance(toValue(patientId)),
    query: async () => {
      const balance = await requestFetch(`/api/patients/${toValue(patientId)}/balance`)
      return balance
    },
    enabled: () => !!toValue(patientId)
  })
}

const _usePayment = (paymentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_KEYS.payment(toValue(paymentId)),
    query: async () => {
      const resp = await requestFetch(`/api/payments/${toValue(paymentId)}`)
      return resp
    },
    enabled: () => !!toValue(paymentId)
  })
}

const _usePaymentReceipt = (paymentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => [...PAYMENT_KEYS.root, 'receipt', toValue(paymentId)],
    query: async () => {
      const response = await requestFetch(`/api/payments/${toValue(paymentId)}/receipt`)
      return URL.createObjectURL(new Blob([response as BlobPart], { type: 'text/html' }))
    },
    enabled: () => !!toValue(paymentId)
  })
}

const _usePatientPayments = (patientId: MaybeRefOrGetter<string>, filters?: MaybeRefOrGetter<PatientPaymentsQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => [
      ...PAYMENT_KEYS.patientPayments(toValue(patientId)),
      toValue(filters)?.type ?? '',
      toValue(filters)?.limit ?? '',
      toValue(filters)?.includeVoided ?? ''
    ],
    query: async () => {
      const f = toValue(filters)
      const resp = await requestFetch(`/api/patients/${toValue(patientId)}/payments`, {
        query: {
          ...(f?.type && { type: f.type }),
          ...(f?.limit && { limit: f.limit }),
          ...(f?.includeVoided && { includeVoided: true })
        }
      })
      return resp?.map((item) => ({
        ...item,
        createdAt: parseISO(item.createdAt),
        updatedAt: parseISO(item.updatedAt),
        voidedAt: safeParseISODate(item.voidedAt)
      }))
    },
    enabled: () => !!toValue(patientId)
  })
}

type AppointmentsPaymentStatusPage = {
  data: AppointmentWithPaymentStatus[]
  nextCursor: { date: string; id: string } | null
}

export type AppointmentsPaymentMode = 'all' | 'no-plan'

/**
 * Paginated query for the "all" and "no-plan" modes of the facturation page.
 *
 * - `mode: 'all'` (default) → all billable sessions for the patient, paginated.
 * - `mode: 'no-plan'` → only sessions without a treatment plan (`onlyIndependent`).
 *
 * For plan-scoped "load-all" mode, use `usePlanBillingSessions`.
 *
 * Note: this composable reads `patientId` from the current route (`patients/[id]/*`).
 */
const _useAppointmentsPaymentStatus = (mode: MaybeRefOrGetter<AppointmentsPaymentMode> = 'all') => {
  const route = useRoute()
  const patientId = computed(() => route.params.id as string)
  const modeValue = computed(() => toValue(mode))
  const requestFetch = useRequestFetch()
  return useInfiniteQuery<AppointmentsPaymentStatusPage, Error, { date: string; id: string } | null>({
    key: () => [...PAYMENT_KEYS.patientAppointmentsPaymentStatus(patientId.value), modeValue.value],
    query: async ({ pageParam }): Promise<AppointmentsPaymentStatusPage> => {
      return requestFetch<AppointmentsPaymentStatusPage>('/api/appointments/payments', {
        query: {
          patientId: patientId.value,
          status: ['finished', 'completed'],
          limit: 5,
          onlyIndependent: modeValue.value === 'no-plan' ? true : undefined,
          cursorDate: pageParam?.date,
          cursorId: pageParam?.id
        }
      })
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: () => !!patientId.value
  })
}

const _useVoidPayment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ paymentId }: WithOnSuccess<{ paymentId: string; patientId: string }>) => {
      const resp = await requestFetch(`/api/payments/${paymentId}/void`, {
        method: 'POST'
      })
      return resp
    },
    onSuccess: (_result, { patientId, onSuccess }) => {
      onSuccess?.()

      toast.add({
        title: 'Succès',
        description: 'Paiement annulé avec succès',
        color: 'success'
      })

      queryCache.invalidateQueries({ key: PAYMENT_KEYS.root })
      if (patientId) {
        queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientPayments(patientId) })
        queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientSessionsPaymentStatus(patientId) })
        queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientBalance(patientId) })
      }
    },
    onError: (error, { onError }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de l'annulation du paiement").message,
        color: 'error'
      })
    }
  })
}

// ─── Exports ──────────────────────────────────────────────────
export const useCreatePayment = createSharedComposable(_useCreatePayment)
export const usePayment = _usePayment
export const useAppointmentPayments = _useAppointmentPayments
export const usePatientBalance = _usePatientBalance
export const usePaymentReceipt = _usePaymentReceipt
export const usePatientPayments = _usePatientPayments
export const useAppointmentsPaymentStatus = createSharedComposable(_useAppointmentsPaymentStatus)
export const useVoidPayment = createSharedComposable(_useVoidPayment)
