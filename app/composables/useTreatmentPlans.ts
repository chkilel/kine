import { parseISO } from 'date-fns'

export const usePatientTreatmentPlans = (patientId: MaybeRefOrGetter<string>) => {
  const requestFetch = useRequestFetch()

  // Helper to convert date strings to Date objects
  const convertDates = (plan: any): TreatmentPlanWithProgress => ({
    ...plan,
    prescriptionDate: toDate(plan.prescriptionDate),
    startDate: parseISO(plan.startDate),
    endDate: toDate(plan.endDate),
    createdAt: parseISO(plan.createdAt),
    updatedAt: parseISO(plan.updatedAt),
    deletedAt: toDate(plan.deletedAt),
    // Convert notes date strings back to Date objects
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
    key: () => {
      const id = toValue(patientId)
      return id ? ['treatment-plans', id] : ['treatment-plans', 'no-patient']
    },
    query: async () => {
      const id = toValue(patientId)
      if (!id) return []
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
