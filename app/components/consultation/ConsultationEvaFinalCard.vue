<script setup lang="ts">
  const painLevelAfter = defineModel<number | undefined>('painLevelAfter', { default: undefined })

  const props = defineProps<{
    painLevelBefore?: number
  }>()
</script>

<template>
  <AppCard title="Évaluation finale de la douleur (EVA)" description="Échelle Visuelle Analogique (0-10)">
    <div class="border-primary/20 bg-primary/5 rounded-xl border-2 p-4">
      <div class="space-y-6">
        <div class="px-4">
          <div class="mb-4 flex justify-between">
            <span class="text-success text-xs font-bold">Aucune douleur</span>
            <span class="text-error text-xs font-bold">Douleur maximale</span>
          </div>

          <AppEvaSlider v-model="painLevelAfter" />

          <div
            v-if="painLevelBefore !== undefined"
            class="bg-muted/50 mt-4 flex items-center justify-between rounded-lg p-3"
          >
            <span class="text-muted text-sm">Évaluation initiale</span>
            <span class="font-bold">{{ painLevelBefore }}/10</span>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <UIcon name="i-hugeicons-check-double" class="text-success text-3xl" />
          <p class="text-default text-center font-medium">
            Séance terminée ! Évaluez la douleur du patient après le traitement.
          </p>
        </div>
      </div>
    </div>
  </AppCard>
</template>
