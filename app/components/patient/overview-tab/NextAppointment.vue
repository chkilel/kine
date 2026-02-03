<script setup lang="ts">
  import { LazyConsultationActiveConsultationSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const activeConsultationOverlay = overlay.create(LazyConsultationActiveConsultationSlideover)

  const { data: consultations } = useConsultationsList(() => ({ patientId: patient?.id }))

  const nextConsultation = computed(() => {
    if (!consultations.value) return null
    const upcoming = consultations.value
      .filter((c) => {
        const consultDate = new Date(c.date)
        return !isDateDisabled(consultDate)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return upcoming[0] || null
  })

  function navigateToPlan(planId?: string) {
    const path = `/patients/${patient.id}/plan`
    if (planId) {
      navigateTo({ path, query: { planId } })
    } else {
      navigateTo(path)
    }
  }

  function openConsultationSlideover(consultation: Consultation) {
    activeConsultationOverlay.open({
      patientId: patient.id,
      consultationId: consultation.id
    })
  }
</script>

<template>
  <AppCard title="Prochaine Séance">
    <div v-if="nextConsultation" class="flex flex-col gap-4">
      <div
        class="group border-default bg-muted hover:border-default flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors hover:shadow-md"
        @click="openConsultationSlideover(nextConsultation)"
      >
        <AppDateBadge :date="nextConsultation.date" color="info" variant="soft" size="lg" />

        <div class="min-w-0 flex-1">
          <p class="text-default truncate font-semibold">
            {{ getConsultationTypeLabel(nextConsultation.type || 'follow_up') }}
          </p>
          <p class="text-muted text-sm">
            <span class="font-medium capitalize">
              {{ extractDayAndMonth(nextConsultation.date).dayNameShort }}
            </span>
            à
            <span class="font-semibold">
              {{ formatTimeString(nextConsultation.startTime) }}
            </span>
            - {{ nextConsultation.duration }} min
          </p>
        </div>
        <UIcon
          name="i-lucide-chevron-right"
          class="group-hover:text-primary text-muted size-5 transition-all group-hover:-mr-1"
        />
      </div>

      <UButton
        size="sm"
        variant="ghost"
        color="primary"
        trailing-icon="hugeicons-arrow-right-02"
        label="Voir toutes les séances"
        class="justify-center"
        @click="navigateToPlan(nextConsultation.treatmentPlanId || undefined)"
      />
    </div>

    <UEmpty
      v-else
      icon="hugeicons-calendar-remove-02"
      title="Aucune séance planifiée"
      description="Ce patient n'a pas encore de séance planifiée."
    />
  </AppCard>
</template>
