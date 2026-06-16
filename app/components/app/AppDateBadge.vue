<script setup lang="ts">
  import { computed, useAttrs } from 'vue'
  import { cn } from 'tailwind-variants'

  const props = defineProps<{
    date: string
    color?: UIColor
    variant?: UIVariant
    class?: string
    reverse?: boolean
  }>()

  const attrs = useAttrs()

  const dateInfo = computed(() => extractDayAndMonth(props.date))

  const defaultClass = computed(() => {
    const baseClass = 'flex justify-center gap-0 w-12 h-12'
    return cn(baseClass, props.reverse ? 'flex-col-reverse' : 'flex-col', props.class)
  })

  const forwardedAttrs = computed(() => {
    const { class: _, ...rest } = attrs as Record<string, unknown>
    return rest
  })
</script>

<template>
  <UBadge v-bind="forwardedAttrs" :color="color || 'neutral'" :variant="variant || 'subtle'" :class="defaultClass">
    <span class="text-[16px] leading-none font-bold">{{ dateInfo.day }}</span>
    <USeparator class="my-0.5 w-4 opacity-30" :color="color" />
    <span class="text-xs capitalize">{{ dateInfo.month }}</span>
  </UBadge>
</template>
