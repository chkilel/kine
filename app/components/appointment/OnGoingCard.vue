<script setup lang="ts">
  const { consultation } = defineProps<{
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    'view-session': [consultation: Consultation]
    'view-patient': [patientId: string]
  }>()

  const locationLabel = computed(() => {
    if (consultation.location === 'clinic') {
      return consultation.roomName
    }
    return getLocationLabel(consultation.location || 'clinic')
  })

  const locationIcon = computed(() => {
    if (consultation.location === 'clinic') {
      return 'i-hugeicons-door-01'
    }
    return getLocationIcon(consultation.location || 'clinic')
  })

  const locationColor = computed(() => getLocationColor(consultation.location || 'clinic'))
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
            :name="consultation.pauseStartTime ? 'i-hugeicons-pause' : 'i-hugeicons-play'"
            class="animate-pulse text-3xl"
          />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <UBadge
              :label="consultation.pauseStartTime ? 'En pause' : 'En cours'"
              :color="consultation.pauseStartTime ? 'warning' : 'success'"
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
          <h3 class="mt-1 text-xl font-bold">{{ consultation.patientName }}</h3>
          <p v-if="consultation.planTitle" class="mt-0.5 flex items-center gap-1 text-xs text-white/90">
            <UIcon name="i-hugeicons-file-01" class="text-sm" />
            {{ consultation.planTitle }}
          </p>
          <p class="mt-1 flex items-center gap-1 text-xs text-white/90">
            <UIcon :name="getConsultationTypeIcon(consultation.type || 'follow_up')" class="size-4 shrink-0" />
            {{ getConsultationTypeLabel(consultation.type || 'follow_up') }} •
            {{ formatTimeString(consultation.startTime) }} -
            {{
              formatTimeString(
                addMinutesToTime(
                  consultation.startTime,
                  consultation.duration + (consultation.extendedDurationMinutes || 0)
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
          @click="emit('view-session', consultation)"
        />
        <UButton
          label="Patient"
          icon="i-hugeicons-profile-02"
          variant="solid"
          color="neutral"
          class="rounded-xl p-2"
          @click="emit('view-patient', consultation.patientId)"
        />
      </div>
    </div>
  </div>
</template>
