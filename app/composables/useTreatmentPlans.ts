import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

/**
 * Query for fetching treatment plans for a patient
 * @param patientId - Patient ID to fetch treatment plans for
 * @returns Query result with treatment plans data and computed properties
 */
const _usePatientTreatmentPlans = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  const {
    data: treatmentPlans,
    isLoading: loading,
    error,
    refetch: refetchTreatmentPlans
  } = useQuery({
    key: () => ['treatment-plans', toValue(patientId)],
    query: async () => {
      const id = toValue(patientId)
      const data = await requestFetch(`/api/patients/${id}/treatment-plans`)
      return data?.map((plan) => ({
        ...plan,
        createdAt: parseISO(plan.createdAt),
        updatedAt: parseISO(plan.updatedAt),
        notes:
          plan.notes?.map((note) => ({
            ...note,
            date: parseISO(note.date)
          })) || null
      }))
    },
    enabled: () => !!toValue(patientId)
  })

  const latestActiveTreatmentPlan = computed(() => {
    if (!treatmentPlans.value) return null
    return (
      treatmentPlans.value
        .filter((plan) => plan.status === 'ongoing' || plan.status === 'planned' || plan.status === 'paused')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
    )
  })

  const getCompletedTreatmentPlans = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value.filter((plan) => plan.status === 'completed')
  })

  const getTreatmentPlanHistory = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value
      .filter((plan) => plan.status === 'completed' || plan.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  return {
    treatmentPlans: readonly(treatmentPlans),
    loading: readonly(loading),
    error: readonly(error),
    refetchTreatmentPlans,
    latestActiveTreatmentPlan,
    getCompletedTreatmentPlans,
    getTreatmentPlanHistory
  }
}

/**
 * Mutation for creating a new treatment plan
 * @returns Mutation with create functionality and error handling
 */
const _useCreateTreatmentPlan = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, data }: { patientId: string; data: TreatmentPlanCreate; onSuccess?: () => void }) =>
      requestFetch(`/api/patients/${patientId}/treatment-plans`, {
        method: 'POST',
        body: data
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement créé avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la création du plan de traitement').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for updating an existing treatment plan
 * @returns Mutation with update functionality and error handling
 */
type UpdateTreatmentPlanParams = {
  patientId: string
  planId: string
  data: TreatmentPlanUpdate
  onSuccess?: () => void
}
const _useUpdateTreatmentPlan = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, planId, data }: UpdateTreatmentPlanParams) =>
      requestFetch(`/api/patients/${patientId}/treatment-plans/${planId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement mis à jour avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la mise à jour du plan de traitement').message,
        color: 'error'
      })
    }
  })
}

/**
 * Mutation for deleting a treatment plan
 * @returns Mutation with delete functionality and error handling
 */
const _useDeleteTreatmentPlan = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ patientId, planId }: { patientId: string; planId: string; onSuccess?: () => void }) =>
      requestFetch(`/api/patients/${patientId}/treatment-plans/${planId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { patientId, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement supprimé avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans', patientId] })
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: parseError(error, 'Échec de la suppression du plan de traitement').message,
        color: 'error'
      })
    }
  })
}

export const usePatientTreatmentPlans = createSharedComposable(_usePatientTreatmentPlans)
export const useCreateTreatmentPlan = createSharedComposable(_useCreateTreatmentPlan)
export const useUpdateTreatmentPlan = createSharedComposable(_useUpdateTreatmentPlan)
export const useDeleteTreatmentPlan = createSharedComposable(_useDeleteTreatmentPlan)
