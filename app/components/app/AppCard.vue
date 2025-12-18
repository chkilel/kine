<script setup lang="ts">
  import { computed, useAttrs } from 'vue'
  import { UCard } from '#components'

  const props = defineProps<{
    title?: string
    description?: string
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
    <template v-if="props.title || props.description" #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 v-if="props.title" class="text-lg font-bold">{{ props.title }}</h3>
          <p v-if="props.description" class="text-muted mt-1 text-sm">{{ description }}</p>
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
