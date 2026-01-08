<script setup lang="ts">
  import { computed, useAttrs } from 'vue'

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
    const baseClass = `flex justify-center gap-0 size-12 ${props.reverse ? 'flex-col-reverse' : 'flex-col'}`

    return props.class ? `${baseClass} ${props.class}` : baseClass
  })

  const forwardedAttrs = computed(() => {
    const { class: _, ...rest } = attrs as Record<string, unknown>
    return rest
  })
</script>

<template>
  <UBadge v-bind="forwardedAttrs" :color="color || 'neutral'" :variant="variant || 'subtle'" :class="defaultClass">
    <span class="text-lg leading-none font-bold">{{ dateInfo.day }}</span>
    <span class="text-xs capitalize">{{ dateInfo.month }}</span>
  </UBadge>
</template>
