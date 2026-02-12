<script setup lang="ts">
  const route = useRoute()
  const { data: patient, isPending } = usePatientById(() => route.params.id as string)
</script>

<template>
  <div v-if="isPending" class="flex justify-center py-8">
    <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
  </div>

  <div v-else-if="patient" class="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
    <div class="flex flex-col gap-6 lg:col-span-2">
      <PatientOverviewTabInformation :patient="patient" />
      <PatientOverviewTabMedicalOverview :patient="patient" />
      <PatientOverviewTabNotes :patient="patient" />
    </div>

    <div class="flex flex-col gap-6 lg:col-span-3">
      <PatientOverviewTabActivePlan :patient="patient" />
      <PatientOverviewTabNextAppointment :patient="patient" />
      <PatientOverviewTabPlanHistory :patient="patient" />
    </div>
  </div>
</template>
