<script setup lang="ts">
  const { consultation } = defineProps<{
    consultation: TherapistConsultation
  }>()

  const emit = defineEmits<{
    view: [consultation: TherapistConsultation]
    complete: [consultation: TherapistConsultation]
  }>()
</script>

<template>
  <div class="bg-primary group shadow-primary/20 relative overflow-hidden rounded-2xl p-6 text-white shadow-xl">
    <div
      class="absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl transition-transform duration-500 group-hover:scale-250"
    />
    <div class="relative z-10">
      <div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div class="flex gap-4">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring ring-white/30">
            <UIcon name="i-hugeicons-play-circle" class="animate-pulse text-3xl" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold tracking-widest uppercase">Consultation en cours</span>
              <UBadge
                label="En cours"
                color="success"
                class="animate-pulse rounded-full py-0.5 text-[10px] font-bold uppercase"
              />
            </div>
            <h3 class="mt-1 text-2xl font-bold">{{ consultation.patientName }}</h3>
            <p class="text-inverted/80 flex items-center gap-2 text-sm">
              <UIcon name="i-hugeicons-healtcare" class="size-4" />
              {{ getConsultationTypeLabel(consultation.type || 'follow_up') }} •
              {{ removeSecondsFromTime(consultation.startTime) }} -
              {{ removeSecondsFromTime(consultation.endTime) }}
              {{ consultation.roomName }}
            </p>
          </div>
        </div>
        <div class="flex gap-3">
          <UButton
            @click="emit('view', consultation)"
            variant="subtle"
            color="neutral"
            class="text-primary rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-white"
          >
            Accéder au dossier
          </UButton>
          <UButton
            @click="emit('complete', consultation)"
            class="bg-primary/80 hover:bg-primary rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white"
          >
            Terminer
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
