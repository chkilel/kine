<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'
  import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date'
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'

  // Const
  const tabs = [
    { label: "Vue d'Ensemble", slot: 'overview', value: 'overview' },
    { label: 'Plan de traitement', slot: 'plan', value: 'plan' },
    { label: 'Séances', slot: 'seances', value: 'seances' },
    { label: 'Documents', slot: 'documents', value: 'documents' },
    { label: 'Facturation', slot: 'facturation', value: 'facturation' }
  ]

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  const router = useRouter()
  const route = useRoute()
  const overlay = useOverlay()
  const editSlideover = overlay.create(LazyPatientEditSlideover)
  const treatmentPlanCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  const { data: patient, error, isPending } = usePatientById(() => route.params.id as string)
  const { data: consultations } = useConsultationsList(() => patient.value?.id || '')

  const activeTab = computed({
    get() {
      const tabFromQuery = route.query.tab as string
      const validTabs = ['overview', 'plan', 'seances', 'documents', 'facturation']
      return validTabs.includes(tabFromQuery) ? tabFromQuery : 'overview'
    },
    set(tab) {
      router.push({
        path: route.path,
        query: { ...route.query, tab }
      })
    }
  })

  const nextAppointment = computed(() => {
    if (!consultations.value || consultations.value.length === 0) return null
    const localDate = today(getLocalTimeZone())

    const upcoming = consultations.value.filter((c) => {
      const consultDate = parseDate(c.date)
      return consultDate.compare(localDate) >= 0
    })

    return upcoming.length > 0 ? upcoming[0] : null
  })

  const formatNextAppointment = computed(() => {
    if (!nextAppointment.value) return null
    const { day, month } = extractDayAndMonth(nextAppointment.value.date)
    const startTime = removeSecondsFromTime(nextAppointment.value.startTime)
    return { day, month, startTime }
  })

  // Handle error after the query
  watchEffect(() => {
    if (error.value) {
      const err = error.value as any
      throw createError({
        statusCode: err.statusCode || err.status || 404,
        statusMessage: err.statusMessage || err.message || 'Patient introuvable'
      })
    }
  })

  function openEditSlideover() {
    if (!patient.value) return
    editSlideover.open({ patient: patient.value })
  }

  function openTreatmentPlanSlideover() {
    if (!patient.value) return
    treatmentPlanCreateSlideover.open({ patient: patient.value })
  }
</script>

<template>
  <UDashboardPanel id="patient-profil" class="bg-elevated">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #title>
          <ClientOnly>
            {{ patient ? formatFullName(patient) : 'Profil du patient' }}
          </ClientOnly>
        </template>

        <template #right>notifications</template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div v-if="isPending" class="flex justify-center py-8">
          <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
        </div>

        <div v-else-if="patient" class="space-y-6">
          <!-- Breadcrumb -->
          <UBreadcrumb :items="breadcrumbItems" />

          <!-- Patient Header -->
          <div class="group bg-default relative mb-6 overflow-hidden rounded-2xl p-6 shadow-sm">
            <div
              class="from-primary-50 dark:from-primary-900/20 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-bl-full bg-linear-to-bl to-transparent"
            ></div>
            <div class="relative z-10 flex flex-col gap-6 md:flex-row">
              <div class="flex shrink-0 flex-col items-center gap-3 md:items-start">
                <UAvatar
                  :alt="formatFullName(patient)"
                  class="ring-muted aspect-square size-28 rounded-2xl bg-cover bg-center bg-no-repeat text-4xl shadow-inner ring-4"
                />
              </div>
              <div class="flex flex-1 flex-col justify-between py-1">
                <div class="flex flex-col items-start justify-between gap-4 md:flex-row">
                  <div>
                    <div class="mb-1 flex items-center gap-3">
                      <h1 class="text-3xl font-bold tracking-tight">
                        {{ formatFullName(patient) }}
                      </h1>
                      <UBadge :color="getPatientStatusColor(patient.status)" size="sm" variant="subtle">
                        {{ getPatientStatusLabel(patient.status) }}
                      </UBadge>
                    </div>
                    <div class="text-muted mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-hugeicons-birthday-cake" class="size-4.5" />
                        <span v-if="patient.dateOfBirth">
                          {{ calculateAge(patient.dateOfBirth) }} ans ({{ formatFrenchDate(patient.dateOfBirth) }})
                        </span>
                      </div>
                      <div
                        v-if="patient.phone"
                        class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
                      >
                        <UIcon name="i-hugeicons-call-02" class="size-4.5" />
                        <a :href="`tel:${patient.phone}`">
                          {{ patient.phone }}
                        </a>
                      </div>
                      <div
                        v-if="patient.email"
                        class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
                      >
                        <UIcon name="i-hugeicons-mail-01" class="size-4.5" />
                        <a class="truncate" :href="`mailto:${patient.email}`">
                          {{ patient.email }}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="nextAppointment"
                    class="bg-primary-50 border-primary-100 text-primary-900 flex flex-col justify-center rounded-xl border px-4 py-3"
                  >
                    <span class="text-primary mb-1 text-xs font-bold tracking-wide uppercase">
                      Prochain Rendez-vous
                    </span>
                    <div class="flex items-center gap-2">
                      <UIcon name="i-hugeicons-calendar-03" class="size-6" />
                      <div class="text-lg font-bold">
                        {{ formatNextAppointment?.day }}
                        <span class="capitalize">{{ formatNextAppointment?.month }}.</span>
                        à {{ formatNextAppointment?.startTime }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="border-default mt-6 flex items-center gap-2 border-t pt-4">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-hugeicons-pencil-edit-02"
                    class="hover:text-primary"
                    @click="openEditSlideover"
                  >
                    Modifier infos
                  </UButton>

                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-hugeicons-plus-sign-circle"
                    class="hover:text-primary"
                  >
                    Nouvelle séance
                  </UButton>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-hugeicons-property-add"
                    class="hover:text-primary"
                    @click="openTreatmentPlanSlideover"
                  >
                    Nouveau plan
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <UTabs v-model="activeTab" variant="link" :items="tabs" default-value="overview" class="w-full">
            <!-- Vue d'Ensemble Tab -->
            <template #overview>
              <LazyPatientOverviewTab v-if="patient" :patient="patient" />
            </template>

            <!-- Séances Tab -->
            <template #seances>
              <LazyPatientSessionsTab />
            </template>

            <!-- Plan de traitement Tab -->
            <template #plan>
              <LazyPatientTreatmentPlanTab v-if="patient" :patient="patient" />
            </template>

            <!-- Documents Tab -->
            <template #documents>
              <LazyPatientDocumentsTab />
            </template>

            <!-- Facturation Tab -->
            <template #facturation>
              <PatientBillingTab />
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
