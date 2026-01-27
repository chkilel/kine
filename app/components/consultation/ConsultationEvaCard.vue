<script setup lang="ts">
  const painLevelBefore = defineModel<number>('painLevelBefore', { default: 0 })
  const evaValidated = defineModel<boolean>('evaValidated', { default: false })
  const evaDisabled = defineModel<boolean>('evaDisabled', { default: false })

  const EVA_MIN = 0
  const EVA_MAX = 10
  const EVA_STEP = 1

  const evaScaleNumbers = computed(() => Array.from({ length: EVA_MAX - EVA_MIN + 1 }, (_, i) => i + EVA_MIN))

  watch(evaDisabled, (newValue) => {
    if (newValue) {
      painLevelBefore.value = 0
    }
  })
</script>

<template>
  <UCard>
    <div class="mb-6 flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-base font-bold">
        <UIcon name="i-hugeicons-analytics" class="text-primary text-xl" />
        Échelle Visuelle Analogique (0-10)
      </h3>
      <div class="flex items-center gap-3">
        <span class="text-muted text-sm">{{ evaDisabled ? 'Non nécessaire' : 'Obligatoire' }}</span>
        <USwitch v-model="evaDisabled" color="neutral" size="lg" />
      </div>
    </div>

    <div v-if="!evaDisabled" class="space-y-6">
      <div class="space-y-4">
        <div class="flex justify-between text-xs">
          <span class="text-success-600 font-bold">Aucune douleur</span>
          <span class="text-error-600 font-bold">Douleur maximale</span>
        </div>

        <USlider
          v-model="painLevelBefore"
          :min="EVA_MIN"
          :max="EVA_MAX"
          :step="EVA_STEP"
          :disabled="evaDisabled"
          :ui="{
            root: 'w-full flex-1',
            track: 'bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 h-4 rounded-full',
            range: 'bg-transparent',
            thumb: 'bg-primary ring-primary shadow-lg'
          }"
          class="w-full flex-1"
        />

        <div class="flex justify-between text-sm">
          <span
            v-for="value in evaScaleNumbers"
            :key="value"
            :class="[
              'inline-flex w-[2ch] justify-center p-0.5 tabular-nums transition-all',
              painLevelBefore === value ? 'text-default font-bold' : 'text-muted'
            ]"
          >
            {{ value.toString().padStart(2, ' ') }}
          </span>
        </div>
      </div>

      <div v-if="!evaValidated" class="flex flex-col items-center gap-2">
        <UIcon name="i-hugeicons-info-circle" class="text-primary text-3xl" />
        <p class="text-primary text-center text-base font-bold">
          Veuillez renseigner la douleur initiale pour commencer
        </p>
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

      <UButton v-else color="neutral" variant="outline" size="lg" block class="font-bold" @click="evaValidated = false">
        Modifier le niveau de douleur
      </UButton>
    </div>

    <div v-else class="flex flex-col items-center gap-2">
      <UIcon name="i-hugeicons-checkmark-circle-01" class="text-success text-3xl" />
      <p class="text-muted text-center text-sm">L'évaluation de la douleur est désactivée pour cette séance</p>
    </div>
  </UCard>
</template>
