<script setup lang="ts">
  import type { StepperItem } from '@nuxt/ui'

  type Step = 'pre-session' | 'active-session' | 'post-session' | 'summary'

  const STEPS = [
    { value: 'pre-session' as Step, label: 'Préparation' },
    { value: 'active-session' as Step, label: 'En cours' },
    { value: 'post-session' as Step, label: 'Bilan' },
    { value: 'summary' as Step, label: 'Résumé' }
  ] satisfies Array<{ value: Step; label: string }>

  const props = defineProps<{
    activeStep: Step
  }>()

  const emit = defineEmits<{
    changeStep: [step: Step]
  }>()

  const stepperItems = computed<StepperItem[]>(() => {
    const activeIndex = STEPS.findIndex((s) => s.value === props.activeStep)

    return STEPS.map((step, index) => ({
      title: step.label,
      description: `Étape ${index + 1} sur ${STEPS.length}`,
      icon:
        step.value === props.activeStep
          ? 'i-hugeicons-clock-05'
          : index < activeIndex
            ? 'i-hugeicons-checkmark-circle-02'
            : 'i-hugeicons-dashed-line-circle',
      value: step.value,
      disabled: index >= activeIndex
    }))
  })

  const activeStepIndex = computed(() => STEPS.findIndex((s) => s.value === props.activeStep))

  function handleStepChange(newValue: string | number | undefined) {
    if (newValue === undefined) return
    const step = STEPS.find((s) => s.value === newValue)
    if (step) {
      emit('changeStep', step.value)
    }
  }
</script>

<template>
  <UCard :ui="{ body: 'p-6' }">
    <UStepper v-model="activeStepIndex" size="lg" :items="stepperItems" @update:model-value="handleStepChange" />

    <!-- <div class="mt-4 text-center">
      <span class="text-muted text-xs font-semibold tracking-wider uppercase">
        Étape {{ activeStepIndex + 1 }} sur {{ STEPS.length }}
      </span>
    </div> -->
  </UCard>
</template>
