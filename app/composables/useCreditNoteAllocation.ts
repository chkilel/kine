export const CREDIT_NOTE_ALLOCATION_KEYS = {
  root: ['credit-note-allocations'] as const,
  creditNoteAllocations: (creditNoteId: string) => [...CREDIT_NOTE_ALLOCATION_KEYS.root, 'credit-note', creditNoteId]
}

const _useCreditNoteAllocations = (creditNoteId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => CREDIT_NOTE_ALLOCATION_KEYS.creditNoteAllocations(toValue(creditNoteId)),
    query: async () => {
      const resp = await requestFetch(`/api/credit-notes/${toValue(creditNoteId)}/allocations`)
      return resp
    },
    enabled: () => !!toValue(creditNoteId)
  })
}

type CreateCreditNoteAllocationParams = {
  creditNoteId: string
  data: CreditNoteAllocationCreate
}

const _useCreateCreditNoteAllocation = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ creditNoteId, data }: WithOnSuccess<CreateCreditNoteAllocationParams>) => {
      return await requestFetch(`/api/credit-notes/${creditNoteId}/allocations`, {
        method: 'POST',
        body: data
      })
    },
    onSuccess: (_result, { creditNoteId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Allocation créée avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({
        key: CREDIT_NOTE_ALLOCATION_KEYS.creditNoteAllocations(creditNoteId)
      })
      queryCache.invalidateQueries({ key: CREDIT_NOTE_KEYS.detail(creditNoteId) })
    },
    onError: (error, { onError }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de l'allocation de l'avoir").message,
        color: 'error'
      })
    }
  })
}

export const useCreditNoteAllocations = _useCreditNoteAllocations
export const useCreateCreditNoteAllocation = createSharedComposable(_useCreateCreditNoteAllocation)
