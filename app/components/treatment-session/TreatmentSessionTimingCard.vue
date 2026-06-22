<script setup lang="ts">
  // ─── Props ───────────────────────────────────────────────────
  const props = defineProps<{ appointment: Appointment }>()

  // ─── Computed state (timing info) ───────────────────────────
  const timingInfo = computed(() => {
    const apt = props.appointment
    const isSessionFinished = apt.status === 'finished'
    return {
      appointmentDate: formatDate(apt.date),
      appointmentStartTime: formatTimeString(apt.startTime),
      appointmentEndTime: formatTimeString(apt.endTime),
      actualStartTime: apt.actualStartTime ? formatTimeString(apt.actualStartTime) : null,
      actualEndTime:
        isSessionFinished && apt.actualStartTime && apt.actualDurationSeconds
          ? formatTimeString(addMinutesToTime(apt.actualStartTime, Math.floor(apt.actualDurationSeconds / 60)))
          : null,
      plannedDurationMinutes: apt.duration,
      actualDurationMinutes: apt.actualDurationSeconds ? Math.floor(apt.actualDurationSeconds / 60) : null,
      totalPausedMinutes: apt.totalPausedSeconds ? Math.floor(apt.totalPausedSeconds / 60) : null,
      isPaused: !!apt.pauseStartTime,
      elapsedTimeSincePause: apt.pauseStartTime ? getTimeSincePause(apt.pauseStartTime) : null
    }
  })

  // ─── Computed state (duration comparison) ──────────────────
  const durationComparison = computed(() => {
    const { plannedDurationMinutes, actualDurationMinutes } = timingInfo.value
    if (actualDurationMinutes === null) return null
    const difference = actualDurationMinutes - plannedDurationMinutes
    if (difference === 0) return { label: "À l'heure", value: difference, isEarly: false, isLate: false }
    if (difference > 0) return { label: `+${difference} min`, value: difference, isEarly: false, isLate: true }
    return { label: `${difference} min`, value: difference, isEarly: true, isLate: false }
  })

  const isOverTime = computed(() => durationComparison.value?.isLate ?? false)

  const timeColor = computed(() => (isOverTime.value ? 'error' : 'success'))
</script>

<template>
  <AppCard
    title="Horaires"
    :description="timingInfo.appointmentDate"
    icon="i-hugeicons-date-time"
    iconColor="primary"
    variant="outline"
    :compact="true"
    :ui="{ header: 'bg-primary/5' }"
  >
    <div class="space-y-2">
      <div class="grid grid-cols-[3fr_2fr] gap-x-2">
        <p class="text-toned col-span-full text-[10px] font-medium tracking-wider uppercase">Horaire prévu</p>
        <div class="flex items-center gap-1 font-medium">
          <p class="text-sm">{{ timingInfo.appointmentStartTime }}</p>
          -
          <p class="text-sm">{{ timingInfo.appointmentEndTime }}</p>
        </div>
        <div class="flex items-center justify-self-end">
          <AppIconBox name="i-hugeicons-time-quarter-pass" color="primary" />
          <p class="text-default text-sm font-semibold">
            <span class="inline-block w-[3ch] text-right">{{ timingInfo.plannedDurationMinutes ?? 0 }}</span>
            min
          </p>
        </div>
      </div>

      <template v-if="timingInfo.actualStartTime">
        <div class="grid grid-cols-[3fr_2fr] gap-x-2">
          <p
            class="text-primary col-span-full flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase"
          >
            Horaire réel
          </p>
          <div class="flex items-center gap-1 font-medium">
            <p class="text-sm">{{ timingInfo.actualStartTime }}</p>
            -
            <p v-if="timingInfo.actualEndTime" class="text-sm">{{ timingInfo.actualEndTime }}</p>
            <p v-else class="text-muted text-xs">En cours</p>
          </div>

          <div class="flex items-center justify-self-end">
            <AppIconBox name="i-hugeicons-time-quarter-pass" :color="timeColor" />
            <p class="text-default text-sm font-semibold">
              <span class="inline-block w-[3ch] text-right">{{ timingInfo.actualDurationMinutes ?? 0 }}</span>
              min
            </p>
          </div>
        </div>
      </template>
    </div>
  </AppCard>
</template>
