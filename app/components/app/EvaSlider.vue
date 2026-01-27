<script setup lang="ts">
  interface Props {
    min?: number
    max?: number
    step?: number
  }

  const { min = 0, max = 10, step = 1 } = defineProps<Props>()

  const model = defineModel<number>()

  const evaScaleNumbers = computed(() => Array.from({ length: max - min + 1 }, (_, i) => i + min))
</script>

<template>
  <div class="relative space-y-2.5">
    <div
      class="from-success via-warning to-error absolute inset-x-0 top-0 flex h-6 justify-between rounded-full bg-linear-to-r px-0.75 text-sm"
    >
      <span
        v-for="value in evaScaleNumbers"
        :key="value"
        class="inline-flex w-[2ch] items-center justify-center rounded-full text-white transition-all"
      >
        {{ value }}
      </span>
    </div>
    <USlider
      v-model="model"
      :min="min"
      :max="max"
      :step="step"
      :ui="{
        root: 'w-full flex-1',
        track: 'bg-transparent h-6',
        range: 'bg-transparent',
        thumb: 'bg-transparent ring-6 ring-white size-6 focus-visible:outline-info/50'
      }"
    />
  </div>
  <!-- <div class="relative space-y-2.5"> 
    <div class="absolute inset-x-0 top-0 flex justify-between bg-green-300 text-sm">
      <span
        v-for="value in evaScaleNumbers"
        :key="value"
        class="inline-flex size-[3ch] items-center justify-center rounded-full p-0.5 transition-all"
        :style="{
          backgroundImage: `linear-gradient(to right, var(--ui-color-success-500), var(--ui-color-warning-500), var(--ui-color-error-500))`,
          backgroundSize: `${evaScaleNumbers.length * 100}% 100%`,
          backgroundPosition: `${(value / max) * 100}% 0`,
          maskImage: `linear-gradient(to right, black 0%, black ${model === value ? 100 : 0}%, transparent ${model === value ? 100 : 0}%)`,
          WebkitMaskImage: `linear-gradient(to right, black 0%, black ${model === value ? 100 : 0}%, transparent ${model === value ? 100 : 0}%)`,
          color: model === value ? 'white' : 'inherit',
          fontWeight: model === value ? 600 : 'inherit'
        }"
      >
        {{ value }}
      </span>
    </div>
    <USlider
      v-model="model"
      :min="min"
      :max="max"
      :step="step"
      :ui="{
        root: 'w-full flex-1',
        track: 'bg-gradient-to-r from-success via-warning to-error h-4',
        range: 'bg-transparent',
        thumb: 'bg-muted ring-5 ring-info size-4 focus-visible:outline-error/50'
      }"
    />
  </div>-->
</template>
