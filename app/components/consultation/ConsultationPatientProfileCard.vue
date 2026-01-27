<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    consultation: Consultation
  }>()

  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patient.id)
  const { data: allConsultations } = useConsultationsList(() => ({
    patientId: props.patient.id,
    treatmentPlanId: props.consultation.treatmentPlanId || undefined
  }))

  const relatedTreatmentPlan = computed(() => {
    if (!treatmentPlans.value || !props.consultation?.treatmentPlanId) return null
    return treatmentPlans.value.find((plan) => plan.id === props.consultation?.treatmentPlanId) || null
  })

  const completedSessionsCount = computed(() => {
    if (!allConsultations.value || !props.consultation) return 0
    const planId = props.consultation.treatmentPlanId
    if (!planId) return 0

    return allConsultations.value.filter((c) => c.status === 'completed').length
  })

  const totalSessionsCount = computed(() => relatedTreatmentPlan.value?.numberOfSessions || 0)

  const progressPercentage = computed(() => {
    if (!totalSessionsCount.value) return 0
    return Math.min(Math.round((completedSessionsCount.value / totalSessionsCount.value) * 100), 100)
  })

  const hasPatientAlerts = computed(() =>
    Boolean(
      props.patient?.allergies?.length ||
      props.patient?.medicalConditions?.length ||
      props.patient?.surgeries?.length ||
      props.patient?.medications?.length
    )
  )

  const painLevelBefore = computed(() => props.consultation?.painLevelBefore ?? null)
</script>

<template>
  <aside class="flex flex-col gap-4 lg:col-span-3">
    <!-- Patient Profile Card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="flex flex-col items-center p-6">
        <div class="bg-primary-50 mb-4 size-28 rounded-full p-2">
          <UAvatar :alt="patient ? formatFullName(patient) : ''" class="h-full w-full" size="3xl" />
        </div>
        <div class="text-center">
          <h2 class="text-xl font-extrabold">
            {{ patient ? formatFullName(patient) : 'Patient' }}
          </h2>
          <p v-if="patient?.dateOfBirth" class="text-muted mt-1 text-sm font-semibold">
            {{ calculateAge(patient.dateOfBirth) }} ans • {{ getGenderLabel(patient.gender) }}
          </p>
        </div>
      </div>

      <!-- Medical Info Section -->
      <div class="border-default border-t px-6 pt-6 pb-6">
        <!-- Treatment Plan -->
        <div v-if="relatedTreatmentPlan" class="mb-5">
          <p class="text-muted mb-3 text-[10px] font-extrabold tracking-widest uppercase">Diagnostic Principal</p>
          <UAlert
            :title="relatedTreatmentPlan.title"
            :description="relatedTreatmentPlan.diagnosis"
            icon="i-hugeicons-healtcare"
            variant="subtle"
            :ui="{
              title: 'text-sm leading-snug font-bold text-default',
              description: 'text-sm opacity-90',
              icon: 'size-6'
            }"
          />
        </div>

        <!-- Medical Alerts -->
        <div v-if="hasPatientAlerts">
          <p class="text-muted mb-3 text-[10px] font-extrabold tracking-widest uppercase">Alertes Médicales</p>

          <div class="space-y-3">
            <UAlert
              v-if="patient?.allergies?.length"
              title="Allergie"
              :description="patient.allergies.join(', ')"
              icon="i-hugeicons-alert-01"
              color="error"
              variant="subtle"
              :ui="{
                title: 'text-sm leading-snug font-bold text-error-700',
                description: 'text-sm opacity-90',
                icon: 'size-6'
              }"
            />

            <UAlert
              v-if="patient?.medicalConditions?.length"
              title="Antécédents médicaux"
              :description="patient.medicalConditions.join(', ')"
              icon="i-hugeicons-medical-file"
              color="warning"
              variant="subtle"
              :ui="{
                title: 'text-sm leading-snug font-bold text-warning-600',
                description: 'text-sm opacity-90',
                icon: 'size-6'
              }"
            />

            <UAlert
              v-if="patient?.surgeries?.length"
              title="Chirurgies"
              :description="patient.surgeries.join(', ')"
              icon="i-hugeicons-hospital"
              color="info"
              variant="subtle"
              :ui="{
                title: 'text-sm leading-snug font-bold text-info-800',
                description: 'text-sm opacity-90',
                icon: 'size-6'
              }"
            />

            <UAlert
              v-if="patient?.medications?.length"
              title="Médicaments"
              :description="patient.medications.join(', ')"
              icon="i-hugeicons-give-pill"
              color="neutral"
              variant="subtle"
              :ui="{
                title: 'text-sm leading-snug font-bold text-neutral-700',
                description: 'text-sm opacity-90',
                icon: 'size-6'
              }"
            />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Stats Card -->
    <UCard :ui="{ body: 'flex items-center justify-between p-4' }">
      <div>
        <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Progression</p>
        <p class="text-lg font-bold">{{ progressPercentage }}%</p>
      </div>
      <div class="bg-border h-8 w-px" />
      <div>
        <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Séances</p>
        <p class="text-lg font-bold">{{ completedSessionsCount }}/{{ totalSessionsCount }}</p>
      </div>
      <div class="bg-border h-8 w-px" />
      <div>
        <p class="text-muted text-[10px] font-bold tracking-tight uppercase">Dernière EVA</p>
        <p class="text-lg font-bold">
          {{ painLevelBefore !== null ? `${painLevelBefore}/10` : '-' }}
        </p>
      </div>
    </UCard>
  </aside>
</template>
