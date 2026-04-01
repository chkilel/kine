<script setup lang="ts">
  const {
    name,
    color = 'neutral',
    size = 'md',
    variant = 'soft'
  } = defineProps<{ name: string; color?: UIColor; size?: 'md' | 'xs' | 'sm' | 'lg' | 'xl'; variant?: UIVariant }>()
</script>
<template>
  <UBadge v-bind="$attrs" :icon="name" :variant :size :color class="" :ui="{ base: 'rounded-full p-2' }" />
</template>
