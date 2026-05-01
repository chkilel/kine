<script setup lang="ts">
  import type { AppConfig } from '@nuxt/schema'
  import cardTheme from '#build/ui/card'
  import type { ComponentConfig } from '#ui/types'
  import { cn } from 'tailwind-variants'

  type Card = ComponentConfig<typeof cardTheme, AppConfig, 'card'>

  const props = defineProps<{
    title?: string
    description?: string
    icon?: string
    iconColor?: UIColor
    centerHeader?: boolean
    compact?: boolean
    ui?: Card['slots']
  }>()

  const mergedUi = computed(() => ({
    root: cn('divide-y-0', props.ui?.root),
    header: cn(props.compact ? 'p-3 px-2 sm:px-3' : 'px-4 sm:px-6', props.ui?.header),
    body: cn(props.compact ? 'p-2 sm:p-3' : 'pt-2 sm:pt-3', props.ui?.body),
    footer: cn(props.compact ? 'p-2 sm:p-3' : 'pt-2 sm:pt-3', props.ui?.footer)
  }))

  //p-4 sm:px-6
</script>

<template>
  <UCard :ui="mergedUi">
    <!-- header slot override all header's props -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <template v-else-if="title || description" #header>
      <div :class="cn('flex items-center gap-2', description && 'items-start', centerHeader && 'justify-center')">
        <UBadge v-if="icon" :icon="icon" variant="soft" size="lg" :color="iconColor" class="flex-none p-1" />
        <div class="min-w-0" :class="{ 'flex-1': !centerHeader }">
          <p v-if="title" class="text-toned text-[13px] leading-none font-semibold tracking-wide uppercase">
            {{ title }}
          </p>

          <p v-if="description" class="text-muted mt-1 truncate text-xs leading-none">
            {{ description }}
          </p>
        </div>
        <div v-if="$slots.actions" class="flex-none">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
