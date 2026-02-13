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
    key: () => ['treatment-plans', { patientId: toValue(patientId) }],
    query: async () => {
      const data = await requestFetch(`/api/treatment-plans?patientId=${toValue(patientId)}`)
      return data?.map((plan) => ({
        ...plan,
        createdAt: parseISO(plan.createdAt),
        updatedAt: parseISO(plan.updatedAt),
        notes:
          (plan.notes || []).map((note) => ({
            ...note,
            date: parseISO(note.date)
          })) || []
      }))
    },
    enabled: () => !!toValue(patientId)
  })

  const activeTreatmentPlans = computed(() => {
    const statusPriority = { ongoing: 0, planned: 1, paused: 2 }
    if (!treatmentPlans.value) return null
    return (
      treatmentPlans.value
        .filter((plan) => plan.status === 'ongoing' || plan.status === 'planned' || plan.status === 'paused')
        .sort((a, b) => {
          const priorityDiff =
            statusPriority[a.status as keyof typeof statusPriority] -
            statusPriority[b.status as keyof typeof statusPriority]
          if (priorityDiff !== 0) return priorityDiff
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        }) || null
    )
  })

  const latestActiveTreatmentPlan = computed(() => {
    if (!treatmentPlans.value) return null
    return activeTreatmentPlans.value?.[0] || null
  })

  const completedTreatmentPlans = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value.filter((plan) => plan.status === 'completed')
  })

  const archivedTreatmentPlans = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value
      .filter((plan) => plan.status === 'completed' || plan.status === 'cancelled')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  })

  const treatmentPlansGroupedByStatus = computed(() => {
    if (!treatmentPlans.value) return []
    const statusPriority: Record<string, number> = {
      ongoing: 1,
      planned: 2,
      paused: 3,
      cancelled: 4,
      completed: 5
    }
    return treatmentPlans.value.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99
      const priorityB = statusPriority[b.status] ?? 99
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
  })

  return {
    treatmentPlans: readonly(treatmentPlans),
    loading: readonly(loading),
    error: readonly(error),
    refetchTreatmentPlans,
    activeTreatmentPlans,
    latestActiveTreatmentPlan,
    completedTreatmentPlans,
    archivedTreatmentPlans,
    treatmentPlansGroupedByStatus
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
    mutation: async ({ data }: { data: TreatmentPlanCreate; onSuccess?: () => void }) =>
      requestFetch('/api/treatment-plans', {
        method: 'POST',
        body: data
      }),
    onSuccess: (_, { data, onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement créé avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans'] })
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
  planId: string
  data: TreatmentPlanUpdate
  onSuccess?: () => void
}
const _useUpdateTreatmentPlan = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({ planId, data }: UpdateTreatmentPlanParams) =>
      requestFetch(`/api/treatment-plans/${planId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement mis à jour avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans'] })
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
    mutation: async ({ planId }: { planId: string; onSuccess?: () => void }) =>
      requestFetch(`/api/treatment-plans/${planId}`, {
        method: 'DELETE'
      }),
    onSuccess: (_, { onSuccess }) => {
      onSuccess?.()
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement supprimé avec succès',
        color: 'success'
      })
      queryCache.invalidateQueries({ key: ['treatment-plans'] })
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

export const usePatientTreatmentPlans = _usePatientTreatmentPlans
export const useCreateTreatmentPlan = createSharedComposable(_useCreateTreatmentPlan)
export const useUpdateTreatmentPlan = createSharedComposable(_useUpdateTreatmentPlan)
export const useDeleteTreatmentPlan = createSharedComposable(_useDeleteTreatmentPlan)
