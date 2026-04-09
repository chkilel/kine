<script setup lang="ts">
  const props = defineProps<{ appointment: AppointmentWithSession }>()

  // ─── Derived state (timing info) ────────────────────────────────────────────
  const timingInfo = computed(() => {
    const apt = props.appointment
    const session = apt.treatmentSession
    const isSessionFinished = session?.status === 'finished' || session?.status === 'completed'
    return {
      appointmentDate: formatDate(apt.date),
      appointmentStartTime: formatTimeString(apt.startTime),
      appointmentEndTime: formatTimeString(apt.endTime),
      actualStartTime: session?.actualStartTime ? formatTimeString(session.actualStartTime) : null,
      actualEndTime:
        isSessionFinished && session.actualStartTime && session.actualDurationSeconds
          ? formatTimeString(addMinutesToTime(session.actualStartTime, Math.floor(session.actualDurationSeconds / 60)))
          : null,
      plannedDurationMinutes: apt.duration,
      actualDurationMinutes: session?.actualDurationSeconds ? Math.floor(session.actualDurationSeconds / 60) : null,
      totalPausedMinutes: session?.totalPausedSeconds ? Math.floor(session.totalPausedSeconds / 60) : null,
      isPaused: !!session?.pauseStartTime,
      elapsedTimeSincePause: session?.pauseStartTime ? getTimeSincePause(session.pauseStartTime) : null
    }
  })

  // ─── Derived state (duration comparison) ───────────────────────────────────
  const durationComparison = computed(() => {
    const { plannedDurationMinutes, actualDurationMinutes } = timingInfo.value
    if (actualDurationMinutes === null) return null
    const difference = actualDurationMinutes - plannedDurationMinutes
    if (difference === 0) return { label: "À l'heure", value: difference, isEarly: false, isLate: false }
    if (difference > 0) return { label: `+${difference} min`, value: difference, isEarly: false, isLate: true }
    return { label: `${difference} min`, value: difference, isEarly: true, isLate: false }
  })

  const isOverTime = computed(() => durationComparison.value?.isLate ?? false)

  // ─── Derived state (display properties) ────────────────────────────────────
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
  <UCard
    variant="outline"
    :ui="{
      root: 'divide-default',
      header: 'bg-primary/5 '
    }"
  >
    <template #header>
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <AppIconBox
            name="i-hugeicons-timer-02"
            size="xl"
            color="primary"
            variant="solid"
            :ui="{ base: 'rounded-xl p-2' }"
          />
          <div>
            <h2 class="text-sm font-black uppercase">Horaires</h2>
            <p class="text-muted text-[11px] font-semibold">Séance du {{ timingInfo.appointmentDate }}</p>
          </div>
        </div>
      </header>
    </template>

    <div class="divide-default space-y-3 divide-y">
      <div>
        <p class="text-muted mb-2 text-[10px] font-bold tracking-wider uppercase">Planifié (Prévu)</p>
        <div class="mb-3 grid grid-cols-2 gap-4">
          <div class="flex items-baseline gap-1">
            <p class="text-muted text-[11px]">Début</p>
            <p class="text-sm font-semibold">{{ timingInfo.appointmentStartTime }}</p>
          </div>
          <div class="flex items-baseline gap-1 justify-self-end">
            <p class="text-muted text-[11px]">Fin</p>
            <p class="text-sm font-semibold">{{ timingInfo.appointmentEndTime }}</p>
          </div>
          <!-- <div class="text-right">
            <p class="text-primary mb-1 text-xs font-medium">Durée</p>
            <p class="text-primary text-sm font-bold">{{ timingInfo.plannedDurationMinutes }} min</p>
          </div> -->
        </div>
      </div>

      <div v-if="timingInfo.actualStartTime">
        <p class="text-primary mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
          Réel
          <span v-if="!timingInfo.actualEndTime" class="bg-primary size-1.5 animate-pulse rounded-full"></span>
        </p>
        <div class="mb-3 grid grid-cols-2 gap-4">
          <div class="flex items-baseline gap-1">
            <p class="text-muted text-[11px]">Début</p>
            <p class="text-sm font-semibold">{{ timingInfo.actualStartTime }}</p>
          </div>
          <div class="flex items-baseline gap-1 justify-self-end">
            <p class="text-muted text-[11px]">Fin</p>
            <p v-if="timingInfo.actualEndTime" class="text-sm font-semibold">{{ timingInfo.actualEndTime }}</p>
            <p v-else class="text-primary text-sm font-medium italic">En cours...</p>
          </div>
        </div>
      </div>
      <div v-if="timingInfo.totalPausedMinutes || timingInfo.isPaused">
        <p class="text-warning mb-2 text-[10px] font-bold tracking-wider uppercase">Pause</p>
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-hugeicons-pause-circle"
          :ui="{ description: 'text-xs font-bold' }"
        >
          <template #title>
            <div class="flex items-center justify-between gap-2">
              <div>
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
          <template #description v-if="timingInfo.elapsedTimeSincePause">
            {{ timingInfo.elapsedTimeSincePause }}
          </template>
        </UAlert>
      </div>

      <div>
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
              :model-value="Math.min(timingInfo.actualDurationMinutes, timingInfo.plannedDurationMinutes)"
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
    </div>
  </UCard>
</template>
