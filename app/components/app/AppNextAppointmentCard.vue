<script setup lang="ts">
  const props = defineProps<{
    date: string
    startTime: string
  }>()

  const formatNextAppointment = computed(() => {
    const { day, month, dayName } = extractDayAndMonth(props.date)
    const time = formatTimeString(props.startTime)
    const h = time.split(':')[0]
    const min = time.split(':')[1]
    return { day, month, dayName, time, h, min }
  })
</script>

<template>
  <UCard variant="subtle" :ui="{ root: 'relative max-md:hidden shrink-0 rounded-2xl shadow-md', body: 'sm:p-4 p-3' }">
    <!-- Decorative circles -->
    <div class="bg-primary/50 absolute top-4 right-4 size-12 rounded-full blur-2xl" />
    <div class="bg-success/30 absolute bottom-2 left-2 size-14 rounded-full blur-xl" />

    <div class="flex gap-3">
      <div class="relative flex flex-col items-center justify-between">
        <!-- Day name -->
        <div class="text-primary text-[10px] font-medium tracking-widest uppercase">
          {{ formatNextAppointment?.dayName }}
        </div>

        <!-- Day number -->
        <div class="text-primary text-xl font-bold">{{ formatNextAppointment?.day }}</div>

        <!-- Month and year -->
        <div class="text-highlighted text-xs font-semibold tracking-widest uppercase">
          {{ formatNextAppointment?.month }}
        </div>
      </div>
      <div>
        <USeparator orientation="vertical" class="h-full" />
      </div>
      <!-- Time -->
      <div class="flex flex-col justify-between font-mono text-2xl font-bold tabular-nums">
        <span class="relative leading-none">
          {{ formatNextAppointment?.h }}
          <span class="absolute -top-2 right-0.5 text-[10px]">h</span>
        </span>
        <span class="relative leading-none">
          {{ formatNextAppointment?.min }}
          <span class="absolute -top-2 right-0.5 text-[10px]">min</span>
        </span>
      </div>
    </div>
  </UCard>
</template>
