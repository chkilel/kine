<script setup lang="ts">
  const props = defineProps<{ appointment: AppointmentWithSession }>()

  const timingInfo = computed(() => {
    const apt = props.appointment
    const session = apt.treatmentSession
    return {
      appointmentDate: formatFrenchDate(apt.date),
      appointmentStartTime: formatTimeString(apt.startTime),
      appointmentEndTime: formatTimeString(apt.endTime),
      actualStartTime: session?.actualStartTime ? formatTimeString(session.actualStartTime) : null,
      actualEndTime:
        session?.status === 'completed' && session.actualStartTime && session.actualDurationSeconds
          ? formatTimeString(addMinutesToTime(session.actualStartTime, Math.floor(session.actualDurationSeconds / 60)))
          : null,
      plannedDurationMinutes: apt.duration,
      actualDurationMinutes: session?.actualDurationSeconds ? Math.floor(session.actualDurationSeconds / 60) : null,
      totalPausedMinutes: session?.totalPausedSeconds ? Math.floor(session.totalPausedSeconds / 60) : null,
      isPaused: !!session?.pauseStartTime,
      elapsedTimeSincePause: session?.pauseStartTime ? getTimeSincePause(session.pauseStartTime) : null
    }
  })

  const durationComparison = computed(() => {
    const { plannedDurationMinutes, actualDurationMinutes } = timingInfo.value
    if (actualDurationMinutes === null) return null
    const difference = actualDurationMinutes - plannedDurationMinutes
    if (difference === 0) return { label: "À l'heure", value: difference, isEarly: false, isLate: false }
    if (difference > 0) return { label: `+${difference} min`, value: difference, isEarly: false, isLate: true }
    return { label: `${difference} min`, value: difference, isEarly: true, isLate: false }
  })

  const isOverTime = computed(() => durationComparison.value?.isLate ?? false)

  const overtimePercentage = computed(() => {
    if (!isOverTime.value || !timingInfo.value.actualDurationMinutes) return 0
    const { plannedDurationMinutes, actualDurationMinutes } = timingInfo.value
    return Math.round(((actualDurationMinutes - plannedDurationMinutes) / plannedDurationMinutes) * 100)
  })

  const progressPercentage = computed(() => {
    if (!timingInfo.value.actualDurationMinutes) return 0
    const { plannedDurationMinutes, actualDurationMinutes } = timingInfo.value
    return Math.min(Math.round((actualDurationMinutes / plannedDurationMinutes) * 100), 100)
  })

  const progressColor = computed(() => (isOverTime.value ? 'error' : 'primary'))

  const timeColor = computed(() => (isOverTime.value ? 'error' : 'success'))
</script>

<template>
  <UCard variant="outline" :ui="{ root: 'divide-none', header: 'pb-0!' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-hugeicons-timer-02" class="text-primary size-5" />
        <p class="text-xs font-bold tracking-wider uppercase">Horaires de la séance</p>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Appointment Times -->
      <div>
        <p class="text-muted mb-2 text-[10px] font-bold uppercase">Planifié</p>
        <div class="text-default flex justify-between text-sm font-semibold">
          <span>{{ timingInfo.appointmentDate }}</span>
          <span class="tabular-nums">
            {{ timingInfo.appointmentStartTime }} -
            {{ timingInfo.appointmentEndTime }}
          </span>
        </div>
      </div>

      <!-- Actual Times (only if session started) -->
      <div v-if="timingInfo.actualStartTime">
        <p class="text-muted mb-2 text-[10px] font-bold uppercase">Réel</p>
        <div
          class="border-primary/20 bg-primary/5 flex items-center justify-between rounded border p-2 text-sm font-semibold"
        >
          <span class="text-primary">Début: {{ timingInfo.actualStartTime }}</span>
          <span v-if="timingInfo.actualEndTime" class="text-primary tabular-nums">
            Fin: {{ timingInfo.actualEndTime }}
          </span>
          <span v-else class="text-muted text-xs">En cours...</span>
        </div>
      </div>

      <!-- Duration -->
      <div class="border-default border-t pt-4">
        <p class="text-muted mb-4 text-[10px] font-bold tracking-wider uppercase">Durée de la séance</p>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <AppIconBox name="i-hugeicons-time-schedule" color="primary" />
              <div>
                <p class="text-muted text-[10px] font-medium">Planifiée</p>
                <p class="text-default text-sm font-bold">{{ timingInfo.plannedDurationMinutes }} min</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-muted text-[10px] font-medium">Réelle</p>
                <p class="text-default text-sm font-bold">{{ timingInfo.actualDurationMinutes ?? 0 }} min</p>
              </div>
              <AppIconBox name="i-hugeicons-timer-01" :color="timeColor" />
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="timingInfo.actualDurationMinutes">
            <UProgress
              size="md"
              :color="progressColor"
              :model-value="timingInfo.actualDurationMinutes"
              :max="timingInfo.plannedDurationMinutes"
            />
          </div>

          <!-- Time Remaining/Over Badge -->
          <div v-if="durationComparison && timingInfo.actualDurationMinutes" class="flex items-center justify-between">
            <span class="text-muted text-[10px] font-medium">
              <template v-if="isOverTime">{{ overtimePercentage }}% du temps supplémentaire</template>
              <template v-else>{{ progressPercentage }}% du temps planifié utilisé</template>
            </span>

            <UBadge variant="outline" :color="timeColor" class="rounded-full px-3 font-bold">
              <UChip size="sm" :color="timeColor" standalone inset />
              {{ durationComparison.label }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Paused Time (only if applicable) -->
      <div v-if="timingInfo.totalPausedMinutes || timingInfo.isPaused">
        <p class="text-muted mb-2 text-[10px] font-bold uppercase">Pause</p>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-hugeicons-pause-circle"
          :description="timingInfo.elapsedTimeSincePause ?? undefined"
          :ui="{ description: 'text-xs font-bold' }"
        >
          <template #title>
            <div class="flex items-center justify-between gap-2">
              <div class="flex flex-col">
                <span v-if="timingInfo.totalPausedMinutes" class="text-default">
                  Total: {{ timingInfo.totalPausedMinutes }} min
                </span>
                <span v-else class="text-default">Pause en cours</span>
              </div>
              <UIcon
                v-if="timingInfo.isPaused"
                name="i-hugeicons-loading-03"
                class="text-warning size-4 animate-spin"
              />
            </div>
          </template>
        </UAlert>
      </div>
    </div>
  </UCard>
</template>
