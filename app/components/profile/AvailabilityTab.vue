<script setup lang="ts">
  import { useAvailability } from '~/composables/useAvailability'

  // Load all availability data on mount
  const { refreshAll } = useAvailability()

  onMounted(async () => {
    await refreshAll()
  })
</script>

<template>
  <div class="mt-5 space-y-6">
    <ProfileAvailabilityWeeklyTemplates />

    <ProfileAvailabilityExceptions />
  </div>
</template>
