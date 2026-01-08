<script setup lang="ts">
  import { computed, useAttrs } from 'vue'

  const props = defineProps<{
    date: string
    time: string
    color?: UIColor
    variant?: UIVariant
    class?: string
    reverse?: boolean
  }>()

  const attrs = useAttrs()

  const defaultClass = computed(() => {
    const baseClass = `flex justify-center gap-1 size-12 ${props.reverse ? 'flex-col-reverse' : 'flex-col'}`

    return props.class ? `${baseClass} ${props.class}` : baseClass
  })

  const forwardedAttrs = computed(() => {
    const { class: _, ...rest } = attrs as Record<string, unknown>
    return rest
  })
</script>

<template>
  <UBadge v-bind="forwardedAttrs" :color="color || 'neutral'" :variant="variant || 'subtle'" :class="defaultClass">
    <span class="text-xs capitalize">{{ extractDayAndMonth(date).dayNameShort }}</span>
    <span class="text-sm leading-none font-bold">
      {{ removeSecondsFromTime(time) }}
    </span>
  </UBadge>
</template>
