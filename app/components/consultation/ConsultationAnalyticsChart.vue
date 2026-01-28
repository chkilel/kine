<script setup lang="ts">
  const props = defineProps<{
    patientId: string
    consultationId: string
  }>()

  const { data: consultations, isPending } = useConsultationsList(() => ({
    patientId: props.patientId
  }))

  const completedConsultations = computed(() => {
    return (consultations.value || [])
      .filter((c) => c.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  const chartData = computed(() => {
    return completedConsultations.value.map((c) => ({
      date: formatFrenchDate(c.date),
      before: c.painLevelBefore || 0,
      after: c.painLevelAfter || 0
    }))
  })

  const isChartEmpty = computed(() => chartData.value.length === 0)
</script>

<template>
  <UCard :ui="{ body: 'p-6' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold">Évolution de la douleur</h3>
        <UButton icon="i-hugeicons-refresh-01" variant="ghost" color="neutral" size="xs" square />
      </div>
    </template>

    <div v-if="isPending" class="flex justify-center py-8">
      <UIcon name="i-hugeicons-loading-03" class="animate-spin text-2xl" />
    </div>

    <div v-else-if="isChartEmpty" class="flex flex-col items-center justify-center py-8 text-center">
      <UIcon name="i-hugeicons-chart-line-up-02" class="text-muted mb-3 text-4xl" />
      <p class="text-muted">Aucune donnée d'évolution disponible</p>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-muted/50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted text-xs uppercase">Total des séances</p>
            <p class="text-2xl font-bold">{{ completedConsultations.length }}</p>
          </div>
          <div class="text-right">
            <p class="text-muted text-xs uppercase">Amélioration moyenne</p>
            <p class="text-success text-2xl font-bold">
              -0.5
              <span class="text-muted text-sm">points</span>
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="(item, index) in chartData" :key="index" class="bg-muted/50 flex items-center gap-4 rounded-lg p-3">
          <div class="flex min-w-[80px] flex-col">
            <span class="text-muted text-xs">Date</span>
            <span class="text-sm font-bold">{{ item.date }}</span>
          </div>
          <div class="flex flex-1 items-center gap-2">
            <div class="flex flex-col items-center">
              <span class="text-muted text-xs">Avant</span>
              <span class="font-bold">{{ item.before }}/10</span>
            </div>
            <div class="bg-border h-8 w-px" />
            <div class="flex flex-col items-center">
              <span class="text-muted text-xs">Après</span>
              <span class="font-bold">{{ item.after }}/10</span>
            </div>
          </div>
          <UBadge
            :color="item.after < item.before ? 'success' : item.after > item.before ? 'error' : 'neutral'"
            size="sm"
          >
            {{ item.after < item.before ? '-' : item.after > item.before ? '+' : '' }}
            {{ item.after - item.before }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>
</template>
