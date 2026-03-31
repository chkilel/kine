<script setup lang="ts">
  const { patient, appointment } = defineProps<{
    patient: Patient
    appointment: AppointmentWithSession
  }>()

  const { treatmentPlans } = usePatientTreatmentPlans(() => patient.id)
  const { data: allAppointments } = useAppointmentsListWithSessions(() => ({ patientId: patient.id, limit: 6 }))

  const relatedTreatmentPlan = computed(() => {
    if (!treatmentPlans.value || !appointment?.treatmentPlanId) return null
    return treatmentPlans.value.find((plan) => plan.id === appointment?.treatmentPlanId) || null
  })

  const completedSessionsCount = computed(() => {
    if (!allAppointments.value || !appointment) return 0
    const planId = appointment.treatmentPlanId
    if (!planId) return 0
    return allAppointments.value.filter((c) => c.treatmentPlanId === planId && c.status === 'completed').length
  })

  const totalSessionsCount = computed(() => relatedTreatmentPlan.value?.numberOfSessions || 0)

  const progressPercentage = computed(() => {
    if (!totalSessionsCount.value) return 0
    return Math.min(Math.round((completedSessionsCount.value / totalSessionsCount.value) * 100), 100)
  })

  const hasPatientAlerts = computed(() =>
    Boolean(
      patient?.allergies?.length ||
      patient?.medicalConditions?.length ||
      patient?.surgeries?.length ||
      patient?.medications?.length
    )
  )
</script>

<template>
  <aside class="flex flex-col gap-4 lg:col-span-3">
    <!-- Medical Info Section -->
    <div class="pb-6">
      <!-- Treatment Plan -->
      <div v-if="relatedTreatmentPlan" class="mb-5">
        <!-- <p class="text-muted mb-3 text-[10px] font-extrabold tracking-widest uppercase">Diagnostic Principal</p> -->
        <UAlert
          color="neutral"
          variant="outline"
          :ui="{
            title: 'text-sm leading-snug font-semibold text-default',
            description: 'text-sm opacity-90',
            icon: 'size-6'
          }"
        >
          <template #title>
            <div class="text-default mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase">
              <UIcon name="i-hugeicons-healtcare" class="text-info-800 size-5" />
              <span>Plan de traitement</span>
            </div>
          </template>
          <template #description>
            <div v-if="totalSessionsCount > 0" class="flex flex-col items-center text-center">
              <div class="relative size-32">
                <svg class="size-full -rotate-90" viewBox="0 0 36 36">
                  <!-- Plan Progress Ring -->
                  <circle class="stroke-info-100" cx="18" cy="18" fill="none" r="16" stroke-width="3" />
                  <circle
                    class="stroke-info"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    :stroke-dasharray="`${progressPercentage}, 100`"
                    stroke-linecap="round"
                    stroke-width="3"
                  />
                </svg>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span class="text-primary text-xl font-bold">
                    {{ completedSessionsCount }}/{{ totalSessionsCount }}
                  </span>
                  <p class="text-muted text-[10px] font-medium tracking-tight uppercase">Séances</p>
                </div>
              </div>
            </div>
            <div class="mt-2 flex min-w-0 flex-1 flex-col">
              <div class="text-info-800 dark:text-info-300 text-sm font-semibold">
                {{ relatedTreatmentPlan.title }}
              </div>
              <div class="mt-1">
                {{ relatedTreatmentPlan.diagnosis }}
              </div>
            </div>
          </template>
        </UAlert>
      </div>

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
              title: 'text-xs leading-snug tracking-wide font-bold uppercase text-error-700',
              description: 'text-sm',
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
              title: 'text-xs leading-snug tracking-wide font-semibold uppercase text-warning-600',
              description: 'text-sm',
              icon: 'size-6'
            }"
          />

          <UAlert
            v-if="patient?.surgeries?.length"
            title="Chirurgies"
            :description="patient.surgeries.join(', ')"
            icon="i-hugeicons-hospital-02"
            color="info"
            variant="subtle"
            :ui="{
              title: 'text-xs leading-snug tracking-wide font-bold uppercase text-info-800 dark:text-info-300',
              description: 'text-sm',
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
              title: 'text-xs leading-snug tracking-wide font-bold uppercase',
              description: 'text-sm',
              icon: 'size-6'
            }"
          />

          <!-- <div class="border-warning divide-muted divide-y overflow-hidden rounded-lg border">
            <div v-if="patient?.allergies?.length" class="flex items-start gap-3 p-3">
              <UIcon name="i-hugeicons-alert-01" class="text-error mt-0.5 shrink-0 text-lg" />
              <div class="flex flex-col gap-2">
                <span class="text-error-600 text-xs leading-none font-bold uppercase">Allergie</span>
                <p class="text-default text-sm leading-tight">{{ patient.allergies.join(', ') }}</p>
              </div>
            </div>

            <div v-if="patient?.medicalConditions?.length" class="flex items-start gap-3 p-3">
              <UIcon name="i-hugeicons-medical-file" class="text-warning-600 mt-0.5 shrink-0 text-lg" />
              <div class="flex flex-col gap-2">
                <span class="text-warning-600 text-xs leading-none font-bold uppercase">Antécédents</span>
                <p class="text-default text-sm leading-tight">
                  {{ patient.medicalConditions.join(', ') }}
                </p>
              </div>
            </div>

            <div v-if="patient?.surgeries?.length" class="flex items-start gap-3 p-3">
              <UIcon name="i-hugeicons-hospital-02" class="text-info mt-0.5 shrink-0 text-lg" />
              <div class="flex flex-col gap-2">
                <span class="text-info-600 text-xs leading-none font-bold uppercase">Chirurgie</span>
                <p class="text-default text-sm leading-tight">{{ patient.surgeries.join(', ') }}</p>
              </div>
            </div>

            <div v-if="patient?.medications?.length" class="flex items-start gap-3 p-3">
              <UIcon name="i-hugeicons-give-pill" class="text-muted mt-0.5 shrink-0 text-lg" />
              <div class="flex flex-col gap-2">
                <span class="text-muted text-xs leading-none font-bold uppercase">Médicament</span>
                <p class="text-default text-sm leading-tight">{{ patient.medications.join(', ') }}</p>
              </div>
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </aside>
</template>
