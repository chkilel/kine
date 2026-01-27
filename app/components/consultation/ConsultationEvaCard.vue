<script setup lang="ts">
  const painLevelBefore = defineModel<number | undefined>('painLevelBefore', { default: undefined })
  const evaValidated = defineModel<boolean>('evaValidated', { default: false })
  const evaEnabled = defineModel<boolean>('evaEnabled', { default: true })

  watch(evaEnabled, (newValue) => {
    if (newValue) {
      painLevelBefore.value = 0
    } else {
      painLevelBefore.value = undefined
    }
  })
</script>

<template>
  <AppCard title="Évaluation de la douleur (EVA)" description="Échelle Visuelle Analogique (0-10)">
    <template #actions>
      <div class="flex items-center gap-3">
        <span class="text-muted text-sm font-medium">
          {{ evaEnabled ? 'Evaluaution Obligatoire' : 'Evaluaution Non nécessaire' }}
        </span>
        <USwitch v-model="evaEnabled" color="neutral" size="lg" />
      </div>
    </template>

    <div class="border-primary/20 bg-primary/5 rounded-xl border-2 border-dashed p-4">
      <div v-if="evaEnabled" class="space-y-6">
        <div class="px-4">
          <div class="mb-2 flex justify-between">
            <span class="text-success text-xs font-bold">Aucune douleur</span>
            <span class="text-error text-xs font-bold">Douleur maximale</span>
          </div>

          <AppEvaSlider v-model="painLevelBefore" />
        </div>

        <div v-if="!evaValidated" class="flex flex-col items-center gap-2">
          <UIcon name="i-hugeicons-information-circle" class="text-primary text-3xl" />
          <p class="text-primary text-center font-medium">Veuillez renseigner la douleur initiale pour commencer</p>
        </div>

        <UButton
          v-if="!evaValidated"
          color="primary"
          variant="solid"
          size="lg"
          block
          class="font-bold"
          @click="evaValidated = true"
        >
          Valider le niveau de douleur
        </UButton>

        <UButton
          v-else
          color="neutral"
          variant="outline"
          size="lg"
          block
          class="font-bold"
          @click="evaValidated = false"
        >
          Modifier le niveau de douleur
        </UButton>
      </div>

      <div v-else class="flex flex-col items-center gap-2">
        <UIcon name="i-hugeicons-checkmark-circle-01" class="text-success text-3xl" />
        <p class="text-muted text-center text-sm">L'évaluation de la douleur est désactivée pour cette séance</p>
      </div>
    </div>
  </AppCard>
</template>
