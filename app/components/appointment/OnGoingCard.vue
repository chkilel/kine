<script setup lang="ts">
  const { appointment } = defineProps<{
    appointment: Appointment
  }>()

  const emit = defineEmits<{
    'view-session': [appointment: Appointment]
    'view-patient': [patientId: string]
  }>()

  const locationLabel = computed(() => {
    if (appointment.location === 'clinic') {
      return appointment.roomName
    }
    return getLocationLabel(appointment.location || 'clinic')
  })

  const locationIcon = computed(() => {
    if (appointment.location === 'clinic') {
      return 'i-hugeicons-door-01'
    }
    return getLocationIcon(appointment.location || 'clinic')
  })

  const locationColor = computed(() => getLocationColor(appointment.location || 'clinic'))
</script>

<template>
  <div class="bg-primary group shadow-primary/40 relative overflow-hidden rounded-3xl p-4 text-white shadow-md">
    <div
      class="dark:bg-primary-500 absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl transition-transform duration-500 group-hover:scale-250 dark:right-auto dark:-left-8"
    />
    <div class="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div class="flex gap-4">
        <div class="flex w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring ring-white/30">
          <UIcon
            :name="appointment.pauseStartTime ? 'i-hugeicons-pause' : 'i-hugeicons-play'"
            class="animate-pulse text-3xl"
          />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <UBadge
              :label="appointment.pauseStartTime ? 'En pause' : 'En cours'"
              :color="appointment.pauseStartTime ? 'warning' : 'success'"
              class="animate-pulse rounded-lg py-0.5 text-[10px] font-bold uppercase"
            />
            <UBadge
              v-if="locationLabel"
              :label="locationLabel"
              :icon="locationIcon"
              :color="locationColor"
              size="sm"
              variant="solid"
              class="rounded-lg uppercase"
            />
          </div>
          <h3 class="mt-1 text-xl font-bold">{{ appointment.patientName }}</h3>
          <p v-if="appointment.planTitle" class="mt-0.5 flex items-center gap-1 text-xs text-white/90">
            <UIcon name="i-hugeicons-file-01" class="text-sm" />
            {{ appointment.planTitle }}
          </p>
          <p class="mt-1 flex items-center gap-1 text-xs text-white/90">
            <UIcon :name="getAppointmentTypeIcon(appointment.type || 'follow_up')" class="size-4 shrink-0" />
            {{ getAppointmentTypeLabel(appointment.type || 'follow_up') }} •
            {{ formatTimeString(appointment.startTime) }} -
            {{
              formatTimeString(
                addMinutesToTime(
                  appointment.startTime,
                  appointment.duration + (appointment.extendedDurationMinutes || 0)
                )
              )
            }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <UButton
          label="Séance en cours"
          icon="i-hugeicons-property-view"
          variant="solid"
          color="success"
          class="rounded-xl py-2 font-semibold"
          :ui="{
            leadingIcon: 'animate-pulse'
          }"
          @click="emit('view-session', appointment)"
        />
        <UButton
          label="Patient"
          icon="i-hugeicons-profile-02"
          variant="solid"
          color="neutral"
          class="rounded-xl p-2"
          @click="emit('view-patient', appointment.patientId)"
        />
      </div>
    </div>
  </div>
</template>
