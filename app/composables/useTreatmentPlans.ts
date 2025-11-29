export const usePatientTreatmentPlans = (patientId?: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  const {
    data: treatmentPlans,
    isLoading: loading,
    error,
    refetch: refetchTreatmentPlans
  } = useQuery({
    key: () => {
      const id = toValue(patientId)
      return id ? ['treatment-plans', id] : ['treatment-plans', 'no-patient']
    },
    query: async () => {
      const id = toValue(patientId)
      if (!id) return []
      return requestFetch(`/api/patients/${id}/treatment-plans`)
    },
    enabled: () => !!toValue(patientId)
  })

  const getActiveTreatmentPlan = computed(() => {
    if (!treatmentPlans.value) return null
    return treatmentPlans.value.find((plan) => plan.status === 'ongoing' || plan.status === 'planned') || null
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
