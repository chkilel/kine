<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlanWithProgress
  }>()

  const emit = defineEmits<{
    'edit-plan': []
    'create-new': []
  }>()

  const toast = useToast()

  const closeTreatmentPlan = () => {
    console.log('Close treatment plan')
    toast.add({
      title: 'Plan clôturé',
      description: 'Le plan de traitement a été clôturé.',
      color: 'success'
    })
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <TreatmentPlanCard
      :patient="patient"
      :treatment-plan="treatmentPlan"
      @edit-plan="$emit('edit-plan')"
      @close-plan="closeTreatmentPlan"
      @create-new="$emit('create-new')"
    />

    <TreatmentPlanDetails :treatment-plan="treatmentPlan" />

    <TreatmentPlanNotes :patient="patient" :treatment-plan="treatmentPlan" />
  </div>
</template>
