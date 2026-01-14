import { createSharedComposable } from '@vueuse/core'
import { LazyTreatmentPlanCreateSlideover } from '#components'

/**
 * Composable for managing treatment plan slideover
 * @returns Methods to open create and edit slideovers
 */
const _useTreatmentPlanSlideover = () => {
  const overlay = useOverlay()
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSlideover)

  /**
   * Open treatment plan creation slideover
   * @param patient - Patient to create treatment plan for
   */
  const openCreateSlideover = (patient: Patient) => {
    treatmentPlanCreateOverlay.open({
      patient
    })
  }

  /**
   * Open treatment plan edit slideover
   * @param patient - Patient associated with the treatment plan
   * @param treatmentPlan - Treatment plan to edit
   */
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
