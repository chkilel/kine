<script setup lang="ts">
  const EVA_MIN = 0
  const EVA_MAX = 10
  const EVA_STEP = 1

  const {
    title = 'Évaluation de la douleur',
    description = 'Veuillez indiquer le niveau de douleur du patient',
    confirmText = 'Enregistrer',
    cancelText = 'Annuler',
    initialValue = 0
  } = defineProps<{
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    initialValue?: number
  }>()

  const emit = defineEmits<{
    close: [value: number | null]
  }>()

  const evaValue = ref(initialValue)
  const evaScaleNumbers = computed(() => Array.from({ length: EVA_MAX - EVA_MIN + 1 }, (_, i) => i + EVA_MIN))

  function handleConfirm() {
    emit('close', evaValue.value)
  }

  function handleCancel() {
    emit('close', null)
  }
</script>

<template>
  <UModal :ui="{ header: 'hidden' }">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-4">
          <div class="bg-primary-10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon name="i-hugeicons-straight-edge" class="size-6" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-bold">{{ title }}</h3>
            <p class="text-muted mt-1 text-sm">{{ description }}</p>
          </div>
        </div>

        <div class="mt-2 flex items-center justify-between">
          <span class="text-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <span class="size-2 rounded-full bg-green-500" />
            Aucun
          </span>
          <span class="text-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <span class="size-2 rounded-full bg-red-600" />
            Intense
          </span>
        </div>

        <div class="flex justify-between text-sm">
          <span
            v-for="value in evaScaleNumbers"
            :key="value"
            :class="[
              'inline-flex w-[2ch] justify-center border-t-3 p-0.5 tabular-nums transition-all',
              evaValue === value ? 'text-error border-error font-bold' : 'border-transparent'
            ]"
          >
            {{ value.toString().padStart(2, ' ') }}
          </span>
        </div>

        <USlider
          v-model="evaValue"
          :min="EVA_MIN"
          :max="EVA_MAX"
          :step="EVA_STEP"
          :ui="{
            root: 'w-full flex-1',
            track: 'bg-linear-to-r from-green-600 via-yellow-400 to-red-500',
            range: 'bg-transparent',
            thumb: 'bg-error ring-error focus-visible:outline-error/50'
          }"
          class="w-full flex-1"
        />

        <div class="text-center">
          <span class="bg-muted-100 rounded-full px-4 py-1.5 text-lg font-bold tabular-nums">{{ evaValue }}/10</span>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="outline" color="neutral" @click="handleCancel">
            {{ cancelText }}
          </UButton>
          <UButton color="primary" @click="handleConfirm">
            {{ confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
