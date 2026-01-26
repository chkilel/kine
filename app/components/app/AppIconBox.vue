<script setup lang="ts">
  const {
    name,
    color = 'neutral',
    size = 'md'
  } = defineProps<{ name: string; color?: UIColor; size?: 'md' | 'xs' | 'sm' | 'lg' | 'xl' }>()
</script>
<template>
  <UBadge v-bind="$attrs" :icon="name" variant="soft" :size :color class="rounded-full p-2" />
</template>
