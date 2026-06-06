<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

  const route = useRoute()

  const { data: patient, error, isPending } = usePatientById(() => route.params.id as string)
  const overlay = useOverlay()
  const patientEditSlideover = overlay.create(LazyPatientEditSlideover)
  const planCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  function openEditSlideover() {
    if (!patient.value) return
    patientEditSlideover.open({ patient: patient.value })
  }

  function openTreatmentPlanSlideover() {
    if (!patient.value) return
    planCreateSlideover.open({ patient: patient.value })
  }

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  const items: TabsItem[] = [
    { label: "Vue d'Ensemble", icon: 'i-hugeicons-user', value: 'overview' },
    { label: 'Plan de traitement', icon: 'hugeicons-first-aid-kit', value: 'plan' },
    { label: 'Hors Plan', icon: 'hugeicons-folder-details', value: 'seances' },
    { label: 'Documents', icon: 'i-hugeicons-file-02', value: 'documents' },
    { label: 'Facturation', icon: 'i-hugeicons-wallet-01', value: 'facturation' }
  ]

  const activeTab = computed({
    get() {
      const path = route.path
      const basePath = `/patients/${route.params.id}`

      if (path === basePath) return 'overview'
      if (path === `${basePath}/plan`) return 'plan'
      if (path === `${basePath}/seances`) return 'seances'
      if (path === `${basePath}/documents`) return 'documents'
      if (path === `${basePath}/facturation`) return 'facturation'

      return 'overview'
    },
    async set(tab: string) {
      const basePath = `/patients/${route.params.id}`
      let path = basePath

      if (tab === 'overview') path = basePath
      else if (tab === 'plan') path = `${basePath}/plan`
      else if (tab === 'seances') path = `${basePath}/seances`
      else if (tab === 'documents') path = `${basePath}/documents`
      else if (tab === 'facturation') path = `${basePath}/facturation`

      await navigateTo(path)
    }
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
</script>

<template>
  <AppDashboardPage id="patient-profil" :breadcrumbs="breadcrumbItems">
    <div v-if="isPending" class="flex justify-center py-8">
      <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
    </div>
    <div v-else-if="patient" class="space-y-6">
      <UCard :ui="{ body: 'sm:py-4 py-3' }">
        <!-- Patient Header -->
        <div class="relative z-10 flex flex-col gap-4 md:flex-row">
          <UAvatar :alt="formatFullName(patient)" class="ring-accented aspect-square size-15 text-3xl ring-2" />
          <div class="flex-1">
            <div class="flex flex-col items-start justify-between gap-4 md:flex-row">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <h1 class="text-xl tracking-tight">
                    {{ patient.firstName }}
                    <span class="font-bold">{{ patient.lastName }}</span>
                  </h1>
                  <UButton
                    variant="ghost"
                    color="primary"
                    icon="i-hugeicons-edit-04"
                    square
                    @click="openEditSlideover"
                  />
                  <UBadge
                    :color="getPatientStatusColor(patient.status)"
                    size="md"
                    variant="subtle"
                    class="rounded-full"
                  >
                    {{ getPatientStatusLabel(patient.status) }}
                  </UBadge>
                </div>
                <div class="text-muted flex flex-wrap items-start gap-x-4 gap-y-1 text-[13px]">
                  <div class="flex items-center gap-1.5">
                    <AppIconBox size="md" name="i-hugeicons-calendar-user" class="p-1" />
                    <span v-if="patient.dateOfBirth" class="font-semibold">
                      {{ calculateAge(patient.dateOfBirth) }} ans
                    </span>
                    ({{ formatDate(patient.dateOfBirth) }})
                  </div>
                  <div
                    v-if="patient.phone"
                    class="hover:text-primary flex cursor-pointer items-center gap-1.5 tabular-nums transition-colors"
                  >
                    <AppIconBox size="md" name="i-hugeicons-call-02" class="p-1" />
                    <a :href="`tel:${patient.phone}`">
                      {{ patient.phone }}
                    </a>
                  </div>
                  <div
                    v-if="patient.email"
                    class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
                  >
                    <AppIconBox size="md" name="i-hugeicons-mail-01" class="p-1" />
                    <a class="truncate" :href="`mailto:${patient.email}`">
                      {{ patient.email }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- <AppNextAppointmentCard -->
              <!-- v-if="nextAppointment?.date && nextAppointment?.startTime" -->
              <!-- :date="nextAppointment.date" -->
              <!-- :start-time="nextAppointment.startTime" -->
              <!-- /> -->
              <div class="flex items-center gap-2">
                <!-- <UButton variant="soft" color="primary" icon="i-hugeicons-pencil-edit-02" @click="openEditSlideover">
            Modifier infos
          </UButton> -->

                <UButton variant="soft" color="neutral" icon="i-hugeicons-plus-sign-square" class="hover:text-primary">
                  Nouvelle séance
                </UButton>
                <UButton
                  variant="soft"
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
      </UCard>
      <!-- Tabs Navigation -->
      <UTabs
        v-model="activeTab"
        :content="false"
        :items="items"
        variant="link"
        class="-mx-1 w-full"
        :ui="{ indicator: 'h-[2px]', trigger: 'pl-0 pr-6' }"
      />

      <!-- Tab Content -->
      <NuxtPage />
    </div>
  </AppDashboardPage>
</template>
