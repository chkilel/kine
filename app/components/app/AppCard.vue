<script setup lang="ts">
  const props = defineProps<{
    title?: string
    description?: string
    icon?: string
    iconColor?: UIColor
  }>()

  const attrs = useAttrs()
  const slots = useSlots()

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

  // Check if we should show the header
  const showHeader = computed(() => slots.title || props.title || props.description)
</script>

<template>
  <UCard v-bind="forwardedAttrs" :ui="mergedUi">
    <template v-if="showHeader" #header>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div v-if="icon || $slots.title || title" class="flex items-center gap-1.5">
            <UIcon v-if="icon" :name="icon" class="size-5.5" :class="`text-${iconColor}`" />
            <h3 v-if="$slots.title" class="flex items-center gap-2 text-lg font-bold">
              <slot name="title" />
            </h3>
            <h3 v-else-if="title" class="text-lg font-bold">{{ title }}</h3>
          </div>
          <p v-if="description" class="text-muted truncate text-xs" :class="{ 'ml-7': !!icon }">
            {{ description }}
          </p>
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
