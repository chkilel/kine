<script setup lang="ts">
  const route = useRoute()
  const router = useRouter()

  const consultationId = computed(() => route.params.id as string)

  const validSteps = ['pre-session', 'active-session', 'post-session', 'summary'] as const
  type Step = (typeof validSteps)[number]

  const step = computed<Step>(() => {
    const stepFromQuery = route.query.step as Step
    return validSteps.includes(stepFromQuery) ? stepFromQuery : 'pre-session'
  })

  const goToStep = (newStep: Step) => {
    router.push({
      path: route.path,
      query: { ...route.query, step: newStep }
    })
  }

  const { data: consultation, error, isPending } = useConsultation(() => consultationId.value)
  const { data: patient } = usePatientById(() => consultation.value?.patientId || '')
  const { updateStepAsync } = useConsultationAction()

  const breadcrumbItems = computed(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Planning', to: '/therapists/day' },
    {
      label: patient.value ? `${patient.value.firstName} ${patient.value.lastName}` : 'Consultation',
      to: `/patients/${patient.value?.id || ''}`
    }
  ])

  watchEffect(() => {
    if (consultation.value && step.value && consultation.value.sessionStep !== step.value) {
      updateStepAsync.mutateAsync({
        id: consultationId.value,
        sessionStep: step.value
      })
    }
  })

  if (error.value) {
    const err = error.value as any
    throw createError({
      statusCode: err.statusCode || err.status || 500,
      statusMessage: err.statusMessage || err.message || 'Consultation introuvable'
    })
  }
</script>

<template>
  <UDashboardPanel id="consultation" class="bg-elevated">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <ClientOnly>
            {{ patient ? `${patient.firstName} ${patient.lastName}` : 'Consultation' }}
          </ClientOnly>
        </template>

        <template #trailing>
          <UButton icon="i-hugeicons-cancel-01" variant="ghost" color="primary" to="/therapists/day" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div v-if="isPending" class="flex justify-center py-8">
          <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
        </div>

        <div v-else-if="consultation && patient" class="space-y-6">
          <UBreadcrumb :items="breadcrumbItems" />

          <ConsultationStepProgress :active-step="step" @change-step="goToStep" />

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <ConsultationPatientInfoSidebar
              v-if="patient && consultation"
              :patient="patient"
              :consultation="consultation"
              class="lg:col-span-3"
            />

            <LazyConsultationPreSessionStep
              v-if="step === 'pre-session'"
              :patient="patient"
              :consultation="consultation"
              @start-session="goToStep('active-session')"
              class="lg:col-span-9"
            />

            <LazyConsultationActiveSessionStep
              v-if="step === 'active-session'"
              :patient="patient"
              :consultation="consultation"
              @stop-session="goToStep('post-session')"
              class="lg:col-span-9"
            />

            <LazyConsultationPostSessionStep
              v-if="step === 'post-session'"
              :patient="patient"
              :consultation="consultation"
              @finalize="goToStep('summary')"
              class="lg:col-span-9"
            />

            <LazyConsultationSummaryStep
              v-if="step === 'summary'"
              :patient="patient"
              :consultation="consultation"
              class="lg:col-span-9"
            />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
