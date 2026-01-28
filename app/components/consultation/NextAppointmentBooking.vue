<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
  }>()

  const emit = defineEmits<{
    book: []
  }>()

  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patient.id)
  const latestActivePlan = computed(() => treatmentPlans.value?.find((p) => p.status === 'ongoing'))

  const suggestedFrequency = computed(() => latestActivePlan.value?.sessionFrequency || 1)

  const nextDate = computed(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7 / suggestedFrequency.value)
    const dateStr = date.toISOString().split('T')[0]
    return formatFrenchDate(dateStr || '')
  })
</script>

<template>
  <UCard :ui="{ body: 'p-6' }">
    <template #header>
      <h3 class="text-lg font-bold">Prochain rendez-vous</h3>
    </template>

    <div class="space-y-4">
      <div v-if="latestActivePlan" class="bg-primary/10 rounded-lg p-3">
        <div class="mb-2 flex items-start justify-between">
          <span class="text-primary text-xs font-semibold uppercase">Plan actif</span>
          <UBadge color="primary" size="sm" variant="subtle">{{ latestActivePlan.numberOfSessions }} séances</UBadge>
        </div>
        <p class="text-default text-sm font-semibold">{{ latestActivePlan.title }}</p>
        <p class="text-muted text-xs">{{ latestActivePlan.diagnosis }}</p>
      </div>

      <div>
        <p class="text-muted mb-2 text-xs">Fréquence suggérée</p>
        <p class="font-bold">{{ suggestedFrequency }}x/semaine</p>
      </div>

      <div>
        <p class="text-muted mb-2 text-xs">Prochaine date suggérée</p>
        <p class="font-bold">{{ nextDate }}</p>
      </div>

      <UButton
        variant="solid"
        color="primary"
        size="lg"
        block
        icon="i-hugeicons-calendar-plus-02"
        @click="emit('book')"
      >
        Prendre rendez-vous
      </UButton>
    </div>
  </UCard>
</template>
