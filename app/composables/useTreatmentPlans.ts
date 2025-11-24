export const usePatientTreatmentPlans = (patientId?: string) => {
  // Only fetch if we have a patientId
  const {
    data: treatmentPlans,
    pending: loading,
    error,
    refresh
  } = useFetch<TreatmentPlanWithProgress[]>(() => `/api/patients/${patientId}/treatment-plans`, {
    key: () => `treatment-plans-${patientId}`,
    immediate: !!patientId
  })

  const fetchTreatmentPlans = async (id?: string) => {
    if (id && id !== patientId) {
      // For different patient, use $fetch directly
      const data = await $fetch<TreatmentPlanWithProgress[]>(`/api/patients/${id}/treatment-plans`)
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

  const getCancelledTreatmentPlans = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value.filter((plan) => plan.status === 'cancelled')
  })

  const getTreatmentPlanHistory = computed(() => {
    if (!treatmentPlans.value) return []
    return treatmentPlans.value
      .filter((plan) => plan.status === 'completed' || plan.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateRange = (startDate: Date | string, endDate: Date | string | null) => {
    const start = formatDate(startDate)
    const end = endDate ? formatDate(endDate) : 'En cours'
    return `${start} - ${end}`
  }

  const getTherapistName = (therapist: TreatmentPlanWithProgress['therapist']) => {
    if (!therapist) return 'Non assigné'
    return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || therapist.email || 'Non assigné'
  }

  return {
    treatmentPlans: readonly(treatmentPlans),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
    fetchTreatmentPlans,
    getActiveTreatmentPlan,
    getCompletedTreatmentPlans,
    getCancelledTreatmentPlans,
    getTreatmentPlanHistory,
    formatDate,
    formatDateRange,
    getTherapistName
  }
}
