export const usePatientTreatmentPlans = (patientId?: string) => {
  // Only fetch if we have a patientId
  const {
    data: treatmentPlans,
    isLoading: loading,
    error,
    refetch: refresh
  } = useQuery({
    key: () => (patientId ? ['treatment-plans', patientId] : ['treatment-plans', 'no-patient']),
    query: async () => {
      if (!patientId) return []
      return $fetch(`/api/patients/${patientId}/treatment-plans`)
    }
  })

  const fetchTreatmentPlans = async (id?: string) => {
    if (id && id !== patientId) {
      // For different patient, use $fetch directly
      const data = await $fetch(`/api/patients/${id}/treatment-plans`)
      return data
    } else if (patientId) {
      // For same patient, just refresh existing data
      await refresh()
    }
  }

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
    refresh,
    fetchTreatmentPlans,
    getActiveTreatmentPlan,
    getCompletedTreatmentPlans,
    getTreatmentPlanHistory
  }
}
