<script setup lang="ts">
  const { name } = defineProps<{ name: string }>()
</script>

<template>
  <div class="bg-muted text-muted flex place-content-center rounded-md p-1.5">
    <UIcon :name="name" class="size-4.5 shrink-0" />
  </div>
</template>
