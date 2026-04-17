import { parseISO } from 'date-fns'

export const CREDIT_NOTE_KEYS = {
  root: ['credit-notes'] as const,
  list: (filters?: Record<string, any>) => [...CREDIT_NOTE_KEYS.root, 'list', filters] as const,
  detail: (creditNoteId: string) => [...CREDIT_NOTE_KEYS.root, 'detail', creditNoteId],
  allocations: (creditNoteId: string) => [...CREDIT_NOTE_KEYS.root, 'allocations', creditNoteId]
}

const _useCreditNotes = (filters?: MaybeRefOrGetter<CreditNoteQuery>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => CREDIT_NOTE_KEYS.list(toValue(filters)),
    query: async () => {
      const f = toValue(filters)
      const resp = await requestFetch('/api/credit-notes', {
        query: {
          ...(f?.patientId && { patientId: f.patientId }),
          ...(f?.status && { status: f.status }),
          ...(f?.type && { type: f.type }),
          ...(f?.page && { page: f.page }),
          ...(f?.limit && { limit: f.limit })
        }
      })
      return resp
    }
  })
}

const _useCreditNote = (creditNoteId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()
  return useQuery({
    key: () => CREDIT_NOTE_KEYS.detail(toValue(creditNoteId)),
    query: async () => {
      const resp = await requestFetch(`/api/credit-notes/${toValue(creditNoteId)}`)
      if (resp) {
        return {
          ...resp,
          createdAt: parseISO(resp.createdAt),
          updatedAt: parseISO(resp.updatedAt),
          issuedAt: safeParseISODate(resp.issuedAt),
          cancelledAt: safeParseISODate(resp.cancelledAt)
        }
      }
      return resp
    },
    enabled: () => !!toValue(creditNoteId)
  })
}

type CreateCreditNoteParams = {
  data: CreditNoteCreate
}

const _useCreateCreditNote = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ data }: WithOnSuccess<CreateCreditNoteParams>) => {
      return await requestFetch('/api/credit-notes', {
        method: 'POST',
        body: data
      })
    },
    onSuccess: (_result, { data, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Avoir créé avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: CREDIT_NOTE_KEYS.root })
      if (data.patientId) {
        queryCache.invalidateQueries({ key: CREDIT_NOTE_KEYS.list({ patientId: data.patientId }) })
      }
    },
    onError: (error, { onError }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de la création de l'avoir").message,
        color: 'error'
      })
    }
  })
}

type UpdateCreditNoteParams = {
  creditNoteId: string
  data: CreditNoteUpdate
}

const _useUpdateCreditNote = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ creditNoteId, data }: WithOnSuccess<UpdateCreditNoteParams>) => {
      return await requestFetch(`/api/credit-notes/${creditNoteId}`, {
        method: 'PATCH',
        body: data
      })
    },
    onSuccess: (_result, { creditNoteId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Avoir mis à jour avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: CREDIT_NOTE_KEYS.detail(creditNoteId) })
      queryCache.invalidateQueries({ key: CREDIT_NOTE_KEYS.root })
    },
    onError: (error, { onError }) => {
      onError?.(error)
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Erreur lors de la mise à jour de l'avoir").message,
        color: 'error'
      })
    }
  })
}

export const useCreditNotes = _useCreditNotes
export const useCreditNote = _useCreditNote
export const useCreateCreditNote = createSharedComposable(_useCreateCreditNote)
export const useUpdateCreditNote = createSharedComposable(_useUpdateCreditNote)
