<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()
</script>

<template>
  <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
    <div class="flex flex-col gap-6">
      <PatientOverviewTabInformation :patient="patient" />
      <PatientOverviewTabMedicalOverview :patient="patient" />
      <PatientOverviewTabNotes :patient="patient" />
    </div>

    <div class="flex flex-col gap-6">
      <PatientOverviewTabActivePlan :patient="patient" />
      <!-- Historique des plans -->
      <PatientOverviewTabPlanHistory :patient="patient" />
    </div>
  </div>
</template>
