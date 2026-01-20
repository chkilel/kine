<script setup lang="ts">
  const { consultation } = defineProps<{
    consultation: TherapistConsultation
  }>()

  const emit = defineEmits<{
    'view-session': [consultation: TherapistConsultation]
    'view-patient': [patientId: string]
  }>()
</script>

<template>
  <div class="bg-primary group shadow-primary/50 relative overflow-hidden rounded-2xl p-4 text-white shadow-xl">
    <div
      class="dark:bg-primary-800 absolute -top-8 -left-8 size-32 rounded-full bg-white/40 blur-2xl transition-transform duration-500 group-hover:scale-250"
    />
    <div class="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div class="flex gap-4">
        <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring ring-white/30">
          <UIcon name="i-hugeicons-play-circle" class="animate-pulse text-3xl" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <!-- <span class="text-xs font-semibold tracking-widest uppercase">Consultation en cours</span> -->
            <UBadge
              label="En cours"
              color="success"
              class="animate-pulse rounded-lg py-0.5 text-[10px] font-bold uppercase"
            />
            <UBadge
              v-if="consultation.roomName"
              :label="consultation.roomName"
              icon="i-hugeicons-door-01"
              size="sm"
              color="neutral"
              variant="subtle"
              class="rounded-lg uppercase"
            />
          </div>
          <h3 class="mt-1 text-xl font-bold">{{ consultation.patientName }}</h3>
          <p class="flex items-center gap-2 text-xs text-white/90">
            <UIcon :name="getConsultationTypeIcon(consultation.type || 'follow_up')" class="size-4 shrink-0" />
            {{ getConsultationTypeLabel(consultation.type || 'follow_up') }} •
            {{ removeSecondsFromTime(consultation.startTime) }} -
            {{ removeSecondsFromTime(consultation.endTime) }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <UButton
          label="Séance..."
          icon="i-hugeicons-property-view"
          variant="solid"
          color="success"
          class="hover:text-inverted rounded-xl px-4 font-semibold hover:bg-white"
          @click="emit('view-session', consultation)"
        />
        <UButton
          icon="i-hugeicons-folder-view"
          variant="ghost"
          color="neutral"
          class="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-medium text-white"
          @click="emit('view-patient', consultation.patientId)"
        >
          Patient
        </UButton>
      </div>
    </div>
  </div>
</template>
