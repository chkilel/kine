import { createSharedComposable } from '@vueuse/core'
import { APPOINTMENT_KEYS } from './useAppointment'
import { parseISO } from 'date-fns'

// ─── Keys ─────────────────────────────────────────────────────
export const PAYMENT_KEYS = {
  root: ['payments'] as const,
  patientBalance: (patientId: string) => [...PAYMENT_KEYS.root, 'balance', patientId],
  sessionPayments: (sessionId: string) => [...PAYMENT_KEYS.root, 'session', sessionId],
  patientPayments: (patientId: string) => [...PAYMENT_KEYS.root, 'patient', patientId],
  payment: (paymentId: string) => [...PAYMENT_KEYS.root, 'detail', paymentId],
  patientSessionsPaymentStatus: (patientId: string) => [...PAYMENT_KEYS.root, 'sessions-status', patientId]
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
      const response = await requestFetch<{ payment: any }>('/api/payments', {
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

      const sessionId = paymentData.sessionItems?.[0]?.treatmentSessionId
      if (sessionId) {
        queryCache.invalidateQueries({ key: PAYMENT_KEYS.sessionPayments(sessionId) })
        queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
      }

      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientPayments(paymentData.patientId) })
      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientSessionsPaymentStatus(paymentData.patientId) })
      queryCache.invalidateQueries({ key: PAYMENT_KEYS.patientBalance(paymentData.patientId) })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de l'enregistrement du paiement").message,
        color: 'error'
      })
    }
  })
}

const _useTreatmentSessionPayments = (sessionId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_KEYS.sessionPayments(toValue(sessionId)),
    query: async () => {
      return requestFetch(`/api/treatment-sessions/${toValue(sessionId)}/payments`)
    },
    enabled: () => !!toValue(sessionId)
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
      return requestFetch(`/api/payments/${toValue(paymentId)}`)
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

const _usePatientSessionsPaymentStatus = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_KEYS.patientSessionsPaymentStatus(toValue(patientId)),
    query: async () => {
      return requestFetch<{ data: TreatmentSessionWithPaymentStatus[] }>('/api/treatment-sessions', {
        query: {
          patientId: toValue(patientId),
          status: 'finished,completed',
          includePaymentStatus: true,
          limit: 100
        }
      })
    },
    enabled: () => !!toValue(patientId)
  })
}

const _useVoidPayment = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ paymentId }: { paymentId: string; patientId: string; onSuccess?: () => void }) => {
      return requestFetch(`/api/payments/${paymentId}/void`, {
        method: 'POST'
      })
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
    onError: (error: any) => {
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
export const useTreatmentSessionPayments = _useTreatmentSessionPayments
export const usePatientBalance = _usePatientBalance
export const usePaymentReceipt = _usePaymentReceipt
export const usePatientPayments = _usePatientPayments
export const usePatientSessionsPaymentStatus = _usePatientSessionsPaymentStatus
export const useVoidPayment = createSharedComposable(_useVoidPayment)
