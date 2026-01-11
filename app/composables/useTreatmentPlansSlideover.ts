import { createSharedComposable } from '@vueuse/core'
import { LazyTreatmentPlanCreateSlideover } from '#components'

const _useTreatmentPlanSlideover = () => {
  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)

  const openCreateSlideover = (patient: Patient) => {
    treatmentPlanCreateOverlay.open({
      patient
    })
  }

  const openEditSlideover = (patient: Patient, treatmentPlan: TreatmentPlanWithProgress) => {
    if (!treatmentPlan) return

    treatmentPlanCreateOverlay.open({
      patient,
      treatmentPlan
    })
  }

  return {
    openCreateSlideover,
    openEditSlideover
  }
}

export const useTreatmentPlanSlideover = createSharedComposable(_useTreatmentPlanSlideover)
