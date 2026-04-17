export const PAYMENT_ALLOCATION_KEYS = {
  root: ['payment-allocations'] as const,
  paymentAllocations: (paymentId: string) => [...PAYMENT_ALLOCATION_KEYS.root, 'payment', paymentId]
}

const _usePaymentAllocations = (paymentId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => PAYMENT_ALLOCATION_KEYS.paymentAllocations(toValue(paymentId)),
    query: async () => {
      const resp = await requestFetch(`/api/payments/${toValue(paymentId)}/allocations`)
      return resp
    },
    enabled: () => !!toValue(paymentId)
  })
}

type CreateAllocationParams = {
  paymentId: string
  data: PaymentAllocationCreate
}

const _useCreatePaymentAllocation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ paymentId, data }: WithOnSuccess<CreateAllocationParams>) => {
      return await requestFetch(`/api/payments/${paymentId}/allocations`, {
        method: 'POST',
        body: data
      })
    },
    onSuccess: (_result, { paymentId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Allocation créée avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: PAYMENT_ALLOCATION_KEYS.paymentAllocations(paymentId) })
      queryCache.invalidateQueries({ key: PAYMENT_KEYS.root })
    },
    onError: (error, { onError }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de la création de l'allocation").message,
        color: 'error'
      })
    }
  })
}

export const usePaymentAllocations = _usePaymentAllocations
export const useCreatePaymentAllocation = createSharedComposable(_useCreatePaymentAllocation)
