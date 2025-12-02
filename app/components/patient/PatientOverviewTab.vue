<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-3">
    <!-- Left Column -->
    <PatientOverviewSidebar :patient="patient" />

    <!-- Right Column -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Plan de traitement actif -->
      <PatientActiveTreatmentPlan :patient="patient" />

      <!-- Aperçu des séances -->
      <PatientSessionsOverview />

      <!-- Documents récents -->
      <PatientRecentDocuments />

      <!-- Historique des plans -->
      <PatientTreatmentPlanHistory :patient="patient" />
    </div>
  </div>
</template>
