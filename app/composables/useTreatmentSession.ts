import { createSharedComposable } from '@vueuse/core'

export const TREATMENT_SESSION_KEYS = {
  root: ['treatment-sessions'] as const,
  list: (params: TreatmentSessionQuery) => [...TREATMENT_SESSION_KEYS.root, 'list', params],
  single: (id: string) => [...TREATMENT_SESSION_KEYS.root, id]
}

type SessionActionParams = {
  sessionId: string
}

type StartParams = SessionActionParams & StartAction
type PauseParams = SessionActionParams & PauseAction
type ResumeParams = SessionActionParams & ResumeAction
type EndParams = SessionActionParams & EndAction
type UpdateTagsParams = SessionActionParams & UpdateTagsAction
type ExtendParams = SessionActionParams & ExtendAction
type CancelParams = SessionActionParams
type UpdateClinicalNotesParams = SessionActionParams & UpdateClinicalNotesAction
type UpdatePriceParams = SessionActionParams & UpdatePriceAction

function useSessionInvalidation() {
  const queryCache = useQueryCache()

  return (sessionId?: string, appointmentId?: string) => {
    queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.root })
    queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.root })
    queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.therapistRoot() })
    if (sessionId) {
      queryCache.invalidateQueries({ key: TREATMENT_SESSION_KEYS.single(sessionId) })
    }
    if (appointmentId) {
      queryCache.invalidateQueries({ key: APPOINTMENT_KEYS.single(appointmentId) })
    }
  }
}

const _useCreateTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ appointmentId, primaryConcern, treatmentSummary }: WithOnSuccess<CreateTreatmentSession>) =>
      requestFetch('/api/treatment-sessions', {
        method: 'POST',
        body: { appointmentId, primaryConcern, treatmentSummary }
      }),
    onSuccess: (data, { appointmentId, onSuccess }) => {
      onSuccess?.()
      invalidate(data?.data?.id, appointmentId)
    },
    onError: (error: unknown) => {
      const parsed = parseError(error, 'Impossible de créer la séance de traitement')
      if (parsed.statusCode === 409) return
      toast.add({ title: 'Erreur', description: parsed.message, color: 'error' })
    }
  })
}

const _useStartTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<StartParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/start`, { method: 'POST', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de démarrer la séance').message,
        color: 'error'
      })
    }
  })
}

const _usePauseTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<PauseParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/pause`, { method: 'POST', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre la séance en pause').message,
        color: 'error'
      })
    }
  })
}

const _useResumeTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<ResumeParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/resume`, { method: 'POST', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de reprendre la séance').message,
        color: 'error'
      })
    }
  })
}

const _useEndTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<EndParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/end`, { method: 'POST', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de terminer la séance').message,
        color: 'error'
      })
    }
  })
}

const _useCancelTreatmentSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId }: WithOnSuccess<CancelParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/cancel`, { method: 'POST' }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible d'annuler la séance").message,
        color: 'error'
      })
    }
  })
}

const _useUpdateSessionTags = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<UpdateTagsParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/tags`, { method: 'PATCH', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour les tags').message,
        color: 'error'
      })
    }
  })
}

const _useExtendSession = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<ExtendParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/extend`, { method: 'PATCH', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, "Impossible d'étendre la durée").message,
        color: 'error'
      })
    }
  })
}

const _useUpdateSessionPrice = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<UpdatePriceParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/price`, { method: 'PATCH', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour le prix').message,
        color: 'error'
      })
    }
  })
}

const _useUpdateClinicalNotes = () => {
  const toast = useToast()
  const requestFetch = useRequestFetch()
  const invalidate = useSessionInvalidation()

  return useMutation({
    mutation: ({ sessionId, ...body }: WithOnSuccess<UpdateClinicalNotesParams>) =>
      requestFetch(`/api/treatment-sessions/${sessionId}/clinical-notes`, { method: 'PATCH', body }),
    onSuccess: (data, { sessionId, onSuccess }) => {
      onSuccess?.()
      invalidate(sessionId, data?.data?.appointmentId)
    },
    onError: (error: unknown) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour les notes cliniques').message,
        color: 'error'
      })
    }
  })
}

export const useCreateTreatmentSession = createSharedComposable(_useCreateTreatmentSession)
export const useStartTreatmentSession = createSharedComposable(_useStartTreatmentSession)
export const usePauseTreatmentSession = createSharedComposable(_usePauseTreatmentSession)
export const useResumeTreatmentSession = createSharedComposable(_useResumeTreatmentSession)
export const useEndTreatmentSession = createSharedComposable(_useEndTreatmentSession)
export const useCancelTreatmentSession = createSharedComposable(_useCancelTreatmentSession)
export const useUpdateSessionTags = createSharedComposable(_useUpdateSessionTags)
export const useExtendSession = createSharedComposable(_useExtendSession)
export const useUpdateSessionPrice = createSharedComposable(_useUpdateSessionPrice)
export const useUpdateClinicalNotes = createSharedComposable(_useUpdateClinicalNotes)
