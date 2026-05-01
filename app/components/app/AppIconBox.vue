<script setup lang="ts">
  import type { AppConfig } from '@nuxt/schema'
  import badgeTheme from '#build/ui/badge'
  import type { ComponentConfig } from '#ui/types'
  import { cn } from 'tailwind-variants'

  type Badge = ComponentConfig<typeof badgeTheme, AppConfig, 'badge'>

  const {
    name,
    color = 'neutral',
    size = 'md',
    variant = 'soft',
    ui
  } = defineProps<{
    name: string
    color?: Badge['variants']['color']
    size?: Badge['variants']['size']
    variant?: Badge['variants']['variant']
    ui?: Badge['slots']
  }>()

  const mergedUi = computed(() => ({
    base: cn('rounded-full p-1', ui?.base),
    leadingIcon: cn('flex-none', ui?.leadingIcon)
  }))
</script>
<template>
  <UBadge :icon="name" :variant :size :color :ui="mergedUi" />
</template>
