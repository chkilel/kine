<script setup lang="ts">
  // ─── Props ───────────────────────────────────────────────────
  const { patient, appointment } = defineProps<{ patient: Patient; appointment: Appointment }>()

  // ─── Composables ─────────────────────────────────────────────
  const { data: treatmentPlan } = useTreatmentPlan(() => appointment.treatmentPlanId)
  const { data } = useAppointmentsList(() => ({
    patientId: patient.id,
    limit: 5
  }))
  const { getTherapistName } = useOrganizationMembers()

  // ─── Computed state ──────────────────────────────────────────
  const painLevelBefore = computed(() => appointment.painLevelBefore)
  const painLevelAfter = computed(() => appointment.painLevelAfter)
  const sessionInProgress = computed(() => appointment.status === 'in_progress')
  const shouldShowEVACards = computed(() => sessionInProgress.value || appointment.painLevelAfter != null)

  const appointments = computed(() => data.value?.data)
  const completedSessionsCount = computed(() => {
    if (!appointments.value || !appointment) return 0
    const planId = appointment.treatmentPlanId
    if (!planId) return 0

    return appointments.value.filter((c) => c.treatmentPlanId === planId && c.status === 'completed').length
  })

  const totalSessionsCount = computed(() => treatmentPlan.value?.numberOfSessions || 0)

  const progressPercentage = computed(() => {
    if (!totalSessionsCount.value) return 0
    return Math.min(Math.round((completedSessionsCount.value / totalSessionsCount.value) * 100), 100)
  })

  const hasMedicalInfo = computed(() =>
    Boolean(
      patient?.allergies?.length ||
      patient?.medicalConditions?.length ||
      patient?.surgeries?.length ||
      patient?.medications?.length
    )
  )

  const medicalSections = computed(() => [
    { title: 'Allergies', items: patient.allergies },
    { title: 'Chirurgies', items: patient.surgeries },
    { title: 'Antécédents', items: patient.medicalConditions },
    { title: 'Traitement en cours', items: patient.medications }
  ])
</script>

<template>
  <aside class="flex flex-col gap-y-4 lg:col-span-3">
    <!-- Treatment Plan -->
    <AppCard
      v-if="treatmentPlan"
      title="Plan de traitement"
      color="neutral"
      variant="outline"
      icon="i-hugeicons-healtcare"
      centerHeader
      compact
      :ui="{ header: 'pb-0 sm:pb-0' }"
    >
      <div v-if="totalSessionsCount > 0" class="flex flex-col items-center text-center">
        <div class="relative size-32">
          <svg class="size-full -rotate-90" viewBox="0 0 36 36">
            <!-- Plan Progress Ring -->
            <circle class="stroke-primary-100" cx="18" cy="18" fill="none" r="16" stroke-width="2.5" />
            <circle
              class="stroke-primary"
              cx="18"
              cy="18"
              fill="none"
              r="16"
              :stroke-dasharray="`${progressPercentage}, 100`"
              stroke-linecap="round"
              stroke-width="2.5"
            />
          </svg>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span class="text-primary text-xl font-bold">{{ completedSessionsCount }}/{{ totalSessionsCount }}</span>
            <p class="text-muted text-[10px] font-medium tracking-tight uppercase">Séances</p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-2 text-xs">
        <div class="flex items-center gap-4">
          <div class="n flex items-center gap-2">
            <AppIconBox size="md" color="primary" name="i-hugeicons-user" class="p-1" />
            <h4 class="text-muted text-[10px] font-medium tracking-wider uppercase">Suivi par</h4>
          </div>
          <span class="font-semibold">{{ getTherapistName(treatmentPlan.therapistId) }}</span>
        </div>

        <div class="flex items-start gap-2">
          <AppIconBox size="md" color="primary" name="i-hugeicons-bone-02" class="p-1" />
          <div class="space-y-0.5">
            <h4 class="text-muted text-[10px] font-medium tracking-wider uppercase">Motif de prise en charge</h4>
            <span class="text-sm leading-snug">{{ treatmentPlan.diagnosis || 'Non spécifié' }}</span>
          </div>
        </div>
      </div>
    </AppCard>
    <AppCard
      v-if="shouldShowEVACards"
      compact
      title="Évaluation douleur"
      icon="hugeicons-temperature"
      iconColor="error"
      :ui="{ header: 'pb-0 sm:pb-0' }"
    >
      <div class="divide-default grid grid-cols-2 gap-2 divide-x">
        <div class="flex items-center justify-center gap-3">
          <p class="text-lg font-semibold">{{ painLevelBefore }}/10</p>
          <UIcon name="i-hugeicons-airplane-take-off-01" class="text-primary size-5" />
        </div>

        <div class="flex items-center justify-center gap-3">
          <template v-if="painLevelAfter != null">
            <UIcon name="i-hugeicons-airplane-landing-01" class="text-primary size-5" />
            <p class="text-lg font-semibold">{{ painLevelAfter }}/10</p>
          </template>
          <p v-else class="text-muted text-xs">Sera demandé en fin de séance</p>
        </div>
      </div>
    </AppCard>

    <UCard
      v-if="hasMedicalInfo"
      :ui="{
        root: 'divide-transparent rounded-md',
        body: 'p-0 sm:p-0'
      }"
    >
      <UCollapsible :default-open="false">
        <UButton
          color="primary"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          block
          :ui="{
            base: 'group p-2 sm:p-3 rounded-b-none',
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        >
          <h3 class="text-toned text-[13px] font-semibold tracking-wide uppercase">Alertes Médicales</h3>
        </UButton>

        <template #content>
          <div class="border-default border-t p-2 sm:p-3">
            <template v-if="!hasMedicalInfo">
              <UEmpty
                size="xs"
                variant="naked"
                icon="i-hugeicons-medical-file"
                title="Aucune information médicale"
                description="Aucune donnée médicale n'a été enregistrée pour ce patient."
              />
            </template>

            <div v-else class="divide-default grid">
              <template v-for="(section, index) in medicalSections" :key="index">
                <div v-if="section.items && section.items.length > 0" :key="section.title" class="not-last:pb-2">
                  <h4 class="mb-1 text-[11px] tracking-wide uppercase">{{ section.title }}</h4>
                  <UAlert color="info" variant="soft" :ui="{ root: 'p-2 rounded-sm' }">
                    <template #description>
                      <ul class="text-default list-outside">
                        <li v-for="item in section.items" :key="item" class="text-xs">• {{ item }}</li>
                      </ul>
                    </template>
                  </UAlert>
                </div>
              </template>
            </div>
          </div>
        </template>
      </UCollapsible>
    </UCard>
  </aside>
</template>
