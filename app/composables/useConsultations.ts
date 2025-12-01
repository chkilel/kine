export function useConsultations() {
  const toast = useToast()

  const fetchConsultations = async (patientId: string, query?: ConsultationQuery) => {
    try {
      const data = await $fetch(`/api/patients/${patientId}/consultations`, {
        query
      })

      return { consultations: data?.data || [], error: null }
    } catch (error: any) {
      const errorMessage = error?.data?.statusMessage || error?.message || 'Impossible de charger les consultations'
      toast.add({
        title: 'Erreur',
        description: errorMessage,
        color: 'error'
      })
      return { consultations: [], error }
    }
  }

  const createConsultation = async (patientId: string, consultationData: ConsultationCreate) => {
    try {
      const { data: createdConsulation } = await $fetch(`/api/patients/${patientId}/consultations`, {
        method: 'POST',
        body: consultationData
      })

      const selectedDate = createdConsulation?.date
      const selectedTime = createdConsulation?.startTime

      toast.add({
        title: 'Succès',
        description: `La consultation du ${selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR') : 'date non spécifiée'} à ${selectedTime} a été créée.`,
        color: 'success'
      })
      return { consultation: createdConsulation, error: null }
    } catch (error: any) {
      const errorMessage = error?.data?.statusMessage || error?.message || 'Impossible de créer la consultation'
      toast.add({
        title: 'Erreur',
        description: errorMessage,
        color: 'error'
      })
      return { consultation: null, error }
    }
  }

  const updateConsultation = async (
    patientId: string,
    consultationId: string,
    consultationData: ConsultationUpdate
  ) => {
    try {
      const data = await $fetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'PUT',
        body: consultationData
      })

      toast.add({
        title: 'Succès',
        description: 'Consultation mise à jour avec succès',
        color: 'success'
      })

      return { consultation: data?.data, error: null }
    } catch (error: any) {
      const errorMessage = error?.data?.statusMessage || error?.message || 'Impossible de mettre à jour la consultation'
      toast.add({
        title: 'Erreur',
        description: errorMessage,
        color: 'error'
      })
      return { consultation: null, error }
    }
  }

  const deleteConsultation = async (patientId: string, consultationId: string) => {
    try {
      await $fetch(`/api/patients/${patientId}/consultations/${consultationId}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Succès',
        description: 'Consultation supprimée avec succès',
        color: 'success'
      })

      return true
    } catch (error: any) {
      const errorMessage = error?.data?.statusMessage || error?.message || 'Impossible de supprimer la consultation'
      toast.add({
        title: 'Erreur',
        description: errorMessage,
        color: 'error'
      })
      return false
    }
  }

  const fetchTreatmentPlanConsultations = async (treatmentPlanId: string, query?: ConsultationQuery) => {
    try {
      const data = await $fetch(`/api/treatment-plans/${treatmentPlanId}/consultations`, {
        query
      })

      return {
        consultations: data?.data || [],
        statistics: data?.statistics || null,
        error: null
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.statusMessage || error?.message || 'Impossible de charger les consultations du plan de traitement'
      toast.add({
        title: 'Erreur',
        description: errorMessage,
        color: 'error'
      })
      return { consultations: [], statistics: null, error }
    }
  }

  return {
    fetchConsultations,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    fetchTreatmentPlanConsultations
  }
}
