<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    finalize: []
  }>()

  const consultationAction = useConsultationAction()

  const painLevelAfter = ref<number | undefined>(undefined)
  const painLevelBefore = ref<number | undefined>(undefined)

  const consultationNotes = ref('')
  const selectedTags = ref<string[]>([])

  const painDifferential = computed(() => {
    if (painLevelBefore.value === undefined || painLevelAfter.value === undefined) return null
    return painLevelAfter.value - painLevelBefore.value
  })

  const differentialColor = computed(() => {
    if (painDifferential.value === null) return 'neutral'
    if (painDifferential.value < 0) return 'success'
    if (painDifferential.value > 0) return 'error'
    return 'neutral'
  })

  const differentialMessage = computed(() => {
    if (painDifferential.value === null) return ''
    const absDiff = Math.abs(painDifferential.value)
    if (painDifferential.value < 0) return `Douleur diminuée de ${absDiff} point${absDiff > 1 ? 's' : ''}`
    if (painDifferential.value > 0) return `Douleur augmentée de ${absDiff} point${absDiff > 1 ? 's' : ''}`
    return 'Douleur stable'
  })

  const canFinalize = computed(() => painLevelAfter.value !== undefined)

  watch(
    () => props.consultation,
    (value) => {
      if (!value) return

      painLevelBefore.value = value.painLevelBefore ?? undefined
      painLevelAfter.value = value.painLevelAfter ?? undefined

      consultationNotes.value = value.notes || ''
      selectedTags.value = parseTagsSafely(value.tags)
    },
    { immediate: true }
  )

  function parseTagsSafely(tags: string | null | undefined): string[] {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return []
    }
  }

  async function handleFinalize() {
    if (!canFinalize.value) return

    try {
      await consultationAction.endAsync({
        id: props.consultation.id,
        actualDurationSeconds: 0,
        tags: selectedTags.value,
        painLevelAfter: painLevelAfter.value,
        notes: consultationNotes.value
      })

      emit('finalize')
    } catch (error) {
      console.error('Failed to finalize session:', error)
    }
  }
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-9">
    <div class="space-y-6 lg:col-span-6">
      <ConsultationEvaFinalCard v-model:pain-level-after="painLevelAfter" :pain-level-before="painLevelBefore" />

      <UCard :ui="{ body: 'p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold">Notes de séance</h3>
            <div class="text-muted flex items-center gap-2 text-xs">
              <UIcon name="i-hugeicons-lock" class="size-4" />
              <span>En lecture seule</span>
            </div>
          </div>
        </template>

        <div class="prose prose-sm max-w-none whitespace-pre-wrap">
          {{ consultationNotes || 'Aucune note renseignée' }}
        </div>

        <div v-if="selectedTags.length > 0" class="mt-4 flex flex-wrap gap-2">
          <UBadge v-for="tag in selectedTags" :key="tag" color="primary" variant="subtle" size="sm">
            {{ tag }}
          </UBadge>
        </div>
      </UCard>
    </div>

    <div class="space-y-6 lg:col-span-3">
      <UCard :ui="{ body: 'p-6' }">
        <template #header>
          <h3 class="text-lg font-bold">Différentiel de douleur</h3>
        </template>

        <div v-if="painDifferential !== null" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-muted text-sm">Avant</span>
            <span class="font-bold">{{ painLevelBefore }}/10</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-muted text-sm">Après</span>
            <span class="font-bold">{{ painLevelAfter }}/10</span>
          </div>

          <UAlert
            :color="differentialColor"
            variant="subtle"
            icon="i-hugeicons-chart-line-up-02"
            :description="differentialMessage"
            :ui="{
              description: 'text-sm font-semibold',
              icon: 'size-5'
            }"
          />

          <div class="text-center">
            <div
              class="inline-flex items-center justify-center rounded-full px-6 py-2 text-3xl font-bold"
              :class="{
                'bg-success/10 text-success': differentialColor === 'success',
                'bg-error/10 text-error': differentialColor === 'error',
                'bg-muted text-muted': differentialColor === 'neutral'
              }"
            >
              {{ painDifferential > 0 ? '+' : '' }}{{ painDifferential }}
            </div>
            <p class="text-muted mt-2 text-xs">Points</p>
          </div>
        </div>

        <div v-else class="flex items-center justify-center py-8 text-center">
          <div>
            <UIcon name="i-hugeicons-information-circle" class="text-muted mx-auto mb-2 text-3xl" />
            <p class="text-muted text-sm">Complétez l'évaluation finale</p>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-6' }">
        <template #header>
          <h3 class="text-lg font-bold">Durée réelle</h3>
        </template>

        <div class="text-center">
          <p class="text-4xl font-bold">--:--:--</p>
          <p class="text-muted mt-2 text-sm">Sera calculée à la finalisation</p>
        </div>
      </UCard>

      <UButton
        color="success"
        size="xl"
        variant="solid"
        block
        class="rounded-xl text-lg font-bold shadow-lg"
        :disabled="!canFinalize"
        @click="handleFinalize"
      >
        Confirmer et Continuer
      </UButton>
    </div>
  </div>
</template>
