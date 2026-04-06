<script setup lang="ts">
  interface Props {
    size?: string
  }

  const { size = 'text-4xl' } = defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-center">
    <UIcon name="i-hugeicons-loading-03" class="animate-spin" :class="size" />
  </div>
</template>
