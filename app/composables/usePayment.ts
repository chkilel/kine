import { createSharedComposable } from '@vueuse/core'
import { APPOINTMENT_KEYS } from './useAppointment'

export const PAYMENT_KEYS = {
  root: ['payments'] as const,
  patientBalance: (patientId: string) => [...PAYMENT_KEYS.root, 'balance', patientId],
  sessionPayments: (sessionId: string) => [...PAYMENT_KEYS.root, 'session', sessionId]
}

type CreatePaymentParams = {
  paymentData: PaymentRequestBody
}

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
      return requestFetch(`/api/patients/${toValue(patientId)}/balance`)
    },
    enabled: () => !!toValue(patientId)
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

export const useCreatePayment = createSharedComposable(_useCreatePayment)
export const useTreatmentSessionPayments = _useTreatmentSessionPayments
export const usePatientBalance = _usePatientBalance
export const usePaymentReceipt = _usePaymentReceipt
