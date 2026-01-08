<script setup lang="ts">
  import { computed, useAttrs } from 'vue'

  const props = defineProps<{
    title?: string
    description?: string
    icon?: string
    iconColor?: UIColor
  }>()

  const attrs = useAttrs()

  const defaultUi = {
    root: 'divide-y-0',
    header: 'px-4 sm:px-6  pb-0 sm:pb-0'
  }

  // merge strategy: consumer wins
  const mergedUi = computed(() => ({
    ...defaultUi,
    ...(attrs.ui as Record<string, string> | undefined)
  }))

  // forward everything EXCEPT ui (we handle it)
  const forwardedAttrs = computed(() => {
    const { ui, ...rest } = attrs

    return rest
  })
</script>

<template>
  <UCard v-bind="forwardedAttrs" :ui="mergedUi">
    <template v-if="title || description" #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div v-if="icon || title" class="flex items-center gap-2">
            <UIcon v-if="icon" :name="icon" class="size-5" :class="`text-${iconColor}`" />
            <h3 v-if="title" class="text-lg font-bold">{{ title }}</h3>
          </div>
          <p v-if="description" class="text-muted ml-7 text-xs">{{ description }}</p>
        </div>
        <slot name="actions" />
      </div>
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
