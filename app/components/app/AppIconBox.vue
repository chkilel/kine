<script setup lang="ts">
  const { name } = defineProps<{ name: string }>()
</script>
<template>
  <UBadge v-bind="$attrs" :icon="name" variant="soft" size="md" color="primary" class="rounded-full p-1.5" />
</template>
