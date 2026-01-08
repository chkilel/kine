<script setup lang="ts">
  const { patient } = defineProps<{ patient: Patient }>()

  const medicalSections = computed(() => [
    {
      title: 'Allergies & Contre-indications',
      items: patient.allergies,
      color: 'neutral' as const,
      emptyMessage: 'Aucune allergie connue',
      showWhenEmpty: true
    },
    {
      title: 'Chirurgies',
      items: patient.surgeries,
      color: 'error' as const,
      emptyMessage: 'Aucune chirurgie enregistrée',
      showWhenEmpty: true
    },
    {
      title: 'Antécédents',
      items: patient.medicalConditions,
      color: 'warning' as const,
      emptyMessage: 'Aucun antécédent médical',
      showWhenEmpty: true
    },
    {
      title: 'Traitement en cours',
      items: patient.medications,
      color: 'primary' as const,
      emptyMessage: 'Aucun traitement en cours',
      showWhenEmpty: true
    }
  ])

  const hasMedicalInfo = computed(() => {
    return (
      (patient.allergies && patient.allergies.length > 0) ||
      (patient.surgeries && patient.surgeries.length > 0) ||
      (patient.medicalConditions && patient.medicalConditions.length > 0) ||
      (patient.medications && patient.medications.length > 0)
    )
  })
</script>

<template>
  <AppCard title="Aperçu Médical">
    <template v-if="!hasMedicalInfo">
      <UEmpty
        icon="i-lucide-heartbeat"
        title="Aucune information médicale"
        description="Aucune donnée médicale n'a été enregistrée pour ce patient."
      />
    </template>
    <div v-else class="divide-default grid gap-3 divide-y">
      <div
        v-for="(section, index) in medicalSections"
        :key="section.title"
        :class="{ 'pb-3': index !== medicalSections?.length - 1 }"
      >
        <h4 class="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
          {{ section.title }}
        </h4>
        <template v-if="section.items && section.items.length > 0">
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="item in section.items"
              :key="item"
              :color="section.color"
              variant="subtle"
              class="rounded-full"
            >
              {{ item }}
            </UBadge>
          </div>
        </template>
        <span v-else-if="section.emptyMessage" class="text-muted text-sm">
          {{ section.emptyMessage }}
        </span>
      </div>
    </div>
  </AppCard>
</template>
