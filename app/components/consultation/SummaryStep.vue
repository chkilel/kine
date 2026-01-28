<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    consultation: Consultation
  }>()

  const overlay = useOverlay()
  const planningSlideover = overlay.create(LazyConsultationPlanningSlideover)

  function openNextAppointment() {
    planningSlideover.open({
      patient: props.patient,
      treatmentPlan: null
    })
  }
</script>

<script lang="ts">
  import { LazyConsultationPlanningSlideover } from '#components'
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-9">
    <div class="space-y-6 lg:col-span-6">
      <ConsultationAnalyticsChart :patient-id="patient.id" :consultation-id="consultation.id" />
    </div>

    <div class="space-y-6 lg:col-span-3">
      <ConsultationBillingSection :consultation="consultation" />

      <NextAppointmentBooking :patient="patient" @book="openNextAppointment" />

      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" size="lg" block to="/therapists/day" icon="i-hugeicons-arrow-left">
          Retour au planning
        </UButton>
        <UButton
          variant="solid"
          color="primary"
          size="lg"
          block
          :to="`/patients/${patient.id}?tab=seances`"
          icon="i-hugeicons-user"
        >
          Dossier patient
        </UButton>
      </div>
    </div>
  </div>
</template>
