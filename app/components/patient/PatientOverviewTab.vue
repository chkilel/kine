<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()
</script>

<template>
  <div class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
    <div class="flex flex-col gap-6">
      <PatientInformationCard :patient="patient" />
      <PatientMedicalOverviewCard :patient="patient" />
      <PatientPractitionerNotesCard :patient="patient" />
    </div>

    <div class="flex flex-col gap-6">
      <PatientActiveTreatmentPlan :patient="patient" />
      <!-- Historique des plans -->
      <PatientTreatmentPlanHistory :patient="patient" />
    </div>
  </div>
</template>
