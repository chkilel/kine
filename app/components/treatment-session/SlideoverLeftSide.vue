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

      <UCard
        v-if="hasPatientAlerts"
        :ui="{
          root: 'divide-transparent rounded-md',
          body: 'p-0 sm:p-0'
        }"
      >
        <UCollapsible :default-open="false">
          <UButton
            color="primary"
            variant="ghost"
            class="group p-4 sm:px-6 sm:py-4"
            :ui="{
              base: 'hover:rounded-b-none',
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
            }"
            trailing-icon="i-lucide-chevron-down"
            block
          >
            <h3 class="text-default text-sm font-bold">Alertes Médicales</h3>
          </UButton>

          <template #content>
            <div class="border-default space-y-3 border-t p-4 sm:p-6">
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
            </div>
          </template>
        </UCollapsible>
      </UCard>
    </div>
  </aside>
</template>
