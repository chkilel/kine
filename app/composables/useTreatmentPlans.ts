import { createSharedComposable } from '@vueuse/core'
import { parseISO } from 'date-fns'

const _usePatientTreatmentPlans = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  const convertDates = (plan: any): TreatmentPlanWithProgress => ({
    ...plan,
    createdAt: parseISO(plan.createdAt),
    updatedAt: parseISO(plan.updatedAt),
    notes:
      plan.notes?.map((note: any) => ({
        ...note,
        date: typeof note.date === 'string' ? new Date(note.date) : note.date
      })) || null
  })

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
      return data.map(convertDates)
    },
    enabled: () => !!toValue(patientId)
  })

  const getActiveTreatmentPlan = computed(() => {
    if (!treatmentPlans.value) return null
    return (
      treatmentPlans.value.find(
        (plan) => plan.status === 'ongoing' || plan.status === 'planned' || plan.status === 'paused'
      ) || null
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
    getActiveTreatmentPlan,
    getCompletedTreatmentPlans,
    getTreatmentPlanHistory
  }
}

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

const _useUpdateTreatmentPlan = () => {
  const toast = useToast()
  const queryCache = useQueryCache()
  const requestFetch = useRequestFetch()

  return useMutation({
    mutation: async ({
      patientId,
      planId,
      data
    }: {
      patientId: string
      planId: string
      data: TreatmentPlanUpdate
      onSuccess?: () => void
    }) =>
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

const _useTreatmentPlanConsultations = (
  treatmentPlanId: MaybeRefOrGetter<string>,
  queryParams?: Ref<ConsultationQuery>
) => {
  const requestFetch = useRequestFetch()

  return useQuery({
    enabled: () => !!toValue(treatmentPlanId),
    key: () => {
      const query = queryParams?.value
      return query
        ? ['treatment-plan-consultations', toValue(treatmentPlanId), query]
        : ['treatment-plan-consultations', toValue(treatmentPlanId)]
    },
    query: async () => {
      const id = toValue(treatmentPlanId)
      if (!id) return null
      const data = await requestFetch(`/api/treatment-plans/${id}/consultations`, {
        query: queryParams?.value
      })
      return data
    }
  })
}

export const usePatientTreatmentPlans = createSharedComposable(_usePatientTreatmentPlans)
export const useCreateTreatmentPlan = createSharedComposable(_useCreateTreatmentPlan)
export const useUpdateTreatmentPlan = createSharedComposable(_useUpdateTreatmentPlan)
export const useDeleteTreatmentPlan = createSharedComposable(_useDeleteTreatmentPlan)
export const useTreatmentPlanConsultations = createSharedComposable(_useTreatmentPlanConsultations)
