<script setup lang="ts">
  const EVA_MIN = 0
  const EVA_MAX = 10

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

  const emit = defineEmits<{ close: [value: number | null] }>()

  const evaValue = ref(initialValue)

  const evaItems = computed(() => {
    const colorMap = [
      { base: 'bg-[#22c55e] hover:bg-[#16a34a] text-white', checked: 'has-data-[state=checked]:bg-[#15803d]' }, // 0 - no pain (strong green)
      { base: 'bg-[#4ade80] hover:bg-[#22c55e] text-[#14532d]', checked: 'has-data-[state=checked]:bg-[#16a34a]' }, // 1 - light green
      { base: 'bg-[#86efac] hover:bg-[#4ade80] text-[#14532d]', checked: 'has-data-[state=checked]:bg-[#22c55e]' }, // 2 - soft green
      { base: 'bg-[#bef264] hover:bg-[#a3e635] text-[#3f6212]', checked: 'has-data-[state=checked]:bg-[#84cc16]' }, // 3 - lime transition
      { base: 'bg-[#fef08a] hover:bg-[#fde047] text-[#713f12]', checked: 'has-data-[state=checked]:bg-[#eab308]' }, // 4 - light yellow
      { base: 'bg-[#fde047] hover:bg-[#facc15] text-[#713f12]', checked: 'has-data-[state=checked]:bg-[#ca8a04]' }, // 5 - yellow (midpoint)
      { base: 'bg-[#fdba74] hover:bg-[#fb923c] text-[#7c2d12]', checked: 'has-data-[state=checked]:bg-[#ea580c]' }, // 6 - light orange
      { base: 'bg-[#fb923c] hover:bg-[#f97316] text-white', checked: 'has-data-[state=checked]:bg-[#c2410c]' }, // 7 - orange
      { base: 'bg-[#f87171] hover:bg-[#ef4444] text-white', checked: 'has-data-[state=checked]:bg-[#dc2626]' }, // 8 - light red
      { base: 'bg-[#ef4444] hover:bg-[#dc2626] text-white', checked: 'has-data-[state=checked]:bg-[#b91c1c]' }, // 9 - red
      { base: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white', checked: 'has-data-[state=checked]:bg-[#991b1b]' } // 10 - max pain (deep red)
    ]

    return Array.from({ length: EVA_MAX - EVA_MIN + 1 }, (_, i) => {
      const value = i + EVA_MIN
      const { base, checked } = colorMap[value]!

      return {
        value,
        label: value.toString(),
        class: `${base} ${checked} [&_[data-slot=label]]:text-inherit [&:has([data-state=checked])_[data-slot=label]]:text-white`
      }
    })
  })

  function handleConfirm() {
    emit('close', evaValue.value)
  }

  function handleCancel() {
    emit('close', null)
  }
</script>

<template>
  <UModal
    :ui="{
      content: 'w-[calc(100vw-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]',
      header: 'hidden'
    }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-2">
          <div class="bg-error-50 text-default flex size-10 shrink-0 items-center justify-center rounded">
            <UIcon name="i-hugeicons-temperature" class="size-6" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-bold">{{ title }}</h3>
            <p class="text-muted text-sm">{{ description }}</p>
          </div>
        </div>
        <div>
          <div class="my-1 flex items-end justify-between px-2">
            <span class="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Aucune</span>
            <div class="text-xl font-bold">
              {{ evaValue }}
              <span class="text-muted text-sm">/10</span>
            </div>

            <span class="text-[10px] font-bold tracking-widest text-rose-600 uppercase">intense</span>
          </div>
          <URadioGroup
            v-model="evaValue"
            :items="evaItems"
            variant="table"
            indicator="hidden"
            orientation="horizontal"
            :ui="{
              fieldset: 'grid grid-cols-11'
            }"
          >
            <template #label="{ item }">
              <span class="text-lg">
                {{ item.label }}
              </span>
            </template>
          </URadioGroup>
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
