<script setup lang="ts">
  const props = defineProps<{
    patientId: string
    consultationId: string
  }>()

  const { data: allConsultations } = useConsultationsList(() => ({ patientId: props.patientId }))
  const { data: consultation } = useConsultation(() => props.consultationId)

  const previousConsultations = computed(() => {
    const list = allConsultations.value
    const currentConsultation = consultation.value
    if (!list || !currentConsultation) return []

    return list
      .filter((c) => c.id !== currentConsultation.id && c.date <= currentConsultation.date)
      .slice(-5)
      .reverse()
  })
</script>

<template>
  <UCard>
    <UCollapsible :default-open="false" :ui="{ content: 'space-y-3 pt-3' }">
      <UButton
        color="neutral"
        variant="ghost"
        class="group w-full justify-between"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
        trailing-icon="i-lucide-chevron-down"
      >
        <span class="flex items-center gap-3 text-sm font-semibold">
          <div class="bg-error-5 dark:bg-error-950/20 rounded-lg p-2">
            <UIcon name="i-hugeicons-pulse-01" class="text-error animate-pulse" />
          </div>
          Notes des séances précédentes
        </span>
      </UButton>

      <template #content>
        <div v-if="previousConsultations.length" class="space-y-5 pt-3">
          <div v-for="previous in previousConsultations" :key="previous.id">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-sm font-bold">{{ formatFrenchDate(previous.date) }}</span>
              <span
                v-if="previous.painLevelBefore !== null"
                class="text-muted bg-muted-100 dark:bg-muted-800 rounded px-2 py-0.5 text-xs"
              >
                EVA {{ previous.painLevelBefore }}/10
              </span>
            </div>
            <p class="text-muted line-clamp-3 text-sm leading-relaxed">
              {{ previous.notes || 'Aucune note enregistrée pour cette séance.' }}
            </p>
          </div>
        </div>
        <div v-else class="text-muted pt-3 text-xs">Aucune séance précédente enregistrée.</div>
      </template>
    </UCollapsible>
  </UCard>
</template>
