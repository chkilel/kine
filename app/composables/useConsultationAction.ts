import { createSharedComposable } from '@vueuse/core'

type StartParams = { id: string; actualStartTime: string }
type PauseParams = { id: string; pauseStartTime: string }
type ResumeParams = { id: string; pauseDurationSeconds: number }
type EndParams = {
  id: string
  actualDurationSeconds?: number
  tags?: string[]
  painLevelAfter?: number
  notes?: string
}
type UpdateTagsParams = { id: string; tags: string[] }

type ConsultationActionParams = StartParams | PauseParams | ResumeParams | EndParams | UpdateTagsParams

const _useConsultationAction = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  const mutation = useMutation({
    mutation: async (params: ConsultationActionParams) => {
      const { id, ...body } = params
      return requestFetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        body
      })
    },
    onSuccess: (data, { id }) => {
      toast.add({
        title: 'Succès',
        description: data?.message || 'Consultation mise à jour',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['consultations', id] })
      queryCache.invalidateQueries({ key: ['therapist-consultations'] })
    },
    onError: (error) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Impossible de mettre à jour la consultation').message,
        color: 'error'
      })
    }
  })

  return {
    ...mutation,
    start: (params: StartParams) => mutation.mutate(params),
    startAsync: (params: StartParams) => mutation.mutateAsync(params),
    pause: (params: PauseParams) => mutation.mutate(params),
    pauseAsync: (params: PauseParams) => mutation.mutateAsync(params),
    resume: (params: ResumeParams) => mutation.mutate(params),
    resumeAsync: (params: ResumeParams) => mutation.mutateAsync(params),
    end: (params: EndParams) => mutation.mutate(params),
    endAsync: (params: EndParams) => mutation.mutateAsync(params),
    updateTags: (params: UpdateTagsParams) => mutation.mutate(params),
    updateTagsAsync: (params: UpdateTagsParams) => mutation.mutateAsync(params)
  }
}

export const useConsultationAction = createSharedComposable(_useConsultationAction)
