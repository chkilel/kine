<script setup lang="ts">
  import { LazyAppModalConfirm, LazyConsultationPlanningSlideover } from '#components'

  const props = defineProps<{ patient: Patient }>()

  const toast = useToast()
  const overlay = useOverlay()

  const { openCreateSlideover } = useTreatmentPlanSlideover()

  const sessionPlanningOverlay = overlay.create(LazyConsultationPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const {
    treatmentPlans: allPlans,
    activeTreatmentPlans,
    latestActiveTreatmentPlan,
    archivedTreatmentPlans
  } = usePatientTreatmentPlans(() => props.patient.id)
  const { mutate: deleteConsultation, isLoading: isDeleting } = useDeleteConsultation()

  const onlyIndependentConsultations = ref(false)
  const searchQuery = ref('')
  const statusFilter = ref<ConsultationStatus | 'all'>('all')
  const dateFrom = ref('')
  const dateTo = ref('')
  const showAdvancedFilters = ref(false)

  const selectedPlanId = ref<string | null>(null)
  const selectedPlan = computed(() => {
    const plan =
      !selectedPlanId.value && !onlyIndependentConsultations.value
        ? latestActiveTreatmentPlan.value
        : allPlans.value?.find((p) => p.id === selectedPlanId.value) || null

    return plan ? { ...plan, notes: (plan.notes || []).map((note) => ({ ...note })) } : null
  })

  const queryParams = computed(() => {
    const params: ConsultationQuery = {}
    if (!selectedPlanId.value && onlyIndependentConsultations.value) {
      params.onlyIndependent = true
    } else if (selectedPlan.value) {
      params.treatmentPlanId = selectedPlan.value.id
    }
    return params
  })

  const {
    data: consultations,
    isLoading,
    refetch: refetchConsultations
  } = useConsultationsList(() => props.patient.id, queryParams)

  const selectedPlanTitle = computed(() => {
    if (onlyIndependentConsultations.value) return 'Consultations Indépendantes'
    return selectedPlan.value?.title || ''
  })

  const consultationCount = computed(() => consultations.value?.length || 0)

  const filteredConsultations = computed(() => {
    let filtered = consultations.value || []

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          getConsultationTypeLabel(c.type || 'follow_up')
            .toLowerCase()
            .includes(query) ||
          (c.notes && c.notes.toLowerCase().includes(query)) ||
          (c.treatmentSummary && c.treatmentSummary.toLowerCase().includes(query)) ||
          formatFrenchDate(c.date).includes(query)
      )
    }

    if (statusFilter.value && statusFilter.value !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter.value)
    }

    if (dateFrom.value) {
      filtered = filtered.filter((c) => c.date >= dateFrom.value)
    }
    if (dateTo.value) {
      filtered = filtered.filter((c) => c.date <= dateTo.value)
    }

    return filtered
  })

  const selectPlan = (planId: string | null) => {
    if (planId === null) {
      onlyIndependentConsultations.value = true
    } else {
      onlyIndependentConsultations.value = false
    }
    selectedPlanId.value = planId || null
  }

  const openCreateSessionSlideover = () => {
    if (!selectedPlan.value) return
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: selectedPlan.value
    })
  }

  const handleDeleteSession = async (consultation: Consultation) => {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la séance',
      message: `Êtes-vous sûr de vouloir supprimer cette séance du ${formatFrenchDate(consultation.date)} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      deleteConsultation({
        patientId: props.patient.id,
        consultationId: consultation.id
      })
    }
  }

  const handleEditSession = (consultation: Consultation) => {
    if (!selectedPlan.value) return
    sessionPlanningOverlay.open({
      patient: props.patient,
      treatmentPlan: selectedPlan.value,
      consultation: consultation
    })
  }
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column (1/3) -->
    <aside class="flex flex-col gap-4">
      <!-- Independent Consultations Card -->
      <UCard
        :class="{ 'bg-primary ring-primary-700 border-l-primary-700 border-l-4 ring-2': selectedPlan === null }"
        :ui="{
          root: 'hover:bg-primary-600 bg-primary cursor-pointer text-white transition-all',
          body: 'p-4 sm:p-4'
        }"
        @click="selectPlan(null)"
      >
        <div class="flex flex-col justify-end">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="text-lg font-bold">Consultations Indépendantes</h4>
              <p class="mt-1 text-sm opacity-90">Hors plan de traitement</p>
            </div>
            <AppIconBox
              name="i-hugeicons-stethoscope-02"
              size="xl"
              :variant="onlyIndependentConsultations ? 'solid' : 'subtle'"
              color="warning"
            />
          </div>
        </div>
      </UCard>

      <!-- Active Treatment Plan Cards -->
      <UCollapsible v-if="activeTreatmentPlans?.length" defaultOpen :ui="{ content: 'overflow-visible space-y-4' }">
        <UButton
          variant="subtle"
          size="xl"
          icon="i-hugeicons-inbox-check"
          trailing-icon="i-lucide-chevron-down"
          :label="`Plans en cours (${activeTreatmentPlans.length})`"
          block
          :ui="{
            base: 'h-12 group',
            trailingIcon: 'ml-auto group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        />
        <template #content>
          <UCard
            v-for="plan in activeTreatmentPlans"
            :key="plan.id"
            variant="outline"
            :class="{ 'ring-primary border-l-primary border-l-4 ring-2': selectedPlan?.id === plan.id }"
            :ui="{
              root: 'cursor-pointer transition-all hover:ring-primary mt-4',
              body: 'p-4 sm:p-4'
            }"
            @click="selectPlan(plan.id)"
          >
            <div class="mb-2 flex items-start justify-between">
              <UBadge
                :color="getTreatmentPlanStatusColor(plan.status)"
                variant="subtle"
                size="sm"
                class="font-semibold tracking-wide uppercase"
              >
                {{ getTreatmentPlanStatusLabel(plan.status) }}
              </UBadge>
              <span class="text-muted text-xs">Depuis le {{ formatFrenchDate(plan.startDate) }}</span>
            </div>
            <h4 class="text-default font-bold">{{ plan.title }}</h4>
            <p class="text-muted mt-1 line-clamp-1 text-sm">{{ plan.diagnosis || 'Non spécifié' }}</p>
            <div class="text-muted mt-3 flex items-center gap-4 text-xs">
              <div v-if="plan.sessionFrequency" class="flex items-center gap-1">
                <UIcon name="i-hugeicons-clock-01" class="size-4" />
                <span>{{ plan.sessionFrequency }}x/semaine</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-hugeicons-calendar-02" class="size-4" />
                <span>{{ plan.numberOfSessions }} séances</span>
              </div>
            </div>
          </UCard>
        </template>
      </UCollapsible>

      <!-- Archived Plans (collapsible) -->
      <UCollapsible v-if="archivedTreatmentPlans?.length" :ui="{ content: 'overflow-visible space-y-4' }">
        <UButton
          variant="subtle"
          size="xl"
          icon="i-hugeicons-archive-02"
          trailing-icon="i-lucide-chevron-down"
          :label="`Plans archivés (${archivedTreatmentPlans.length})`"
          block
          :ui="{
            base: 'h-12 group',
            trailingIcon: 'ml-auto group-data-[state=open]:rotate-180 transition-transform duration-200'
          }"
        />
        <template #content>
          <UCard
            v-for="plan in archivedTreatmentPlans"
            :key="plan.id"
            :class="{ 'ring-primary ring-2': selectedPlan?.id === plan.id }"
            :ui="{
              root: 'bg-default hover:bg-elevated cursor-pointer opacity-80 transition-all hover:opacity-100 mt-4',
              body: 'p-4 sm:p-4'
            }"
            @click="selectPlan(plan.id)"
          >
            <div class="mb-2 flex items-start justify-between">
              <UBadge color="neutral" variant="subtle" ] size="sm" class="font-semibold tracking-wide uppercase">
                {{ getTreatmentPlanStatusLabel(plan.status) }}
              </UBadge>
              <span class="text-muted text-xs">
                {{ formatFrenchDate(plan.startDate) }} -
                {{ plan.endDate ? formatFrenchDate(plan.endDate) : 'En cours' }}
              </span>
            </div>
            <h4 class="text-default font-bold">{{ plan.title }}</h4>
            <p class="text-muted mt-1 line-clamp-1 text-sm">{{ plan.diagnosis }}</p>
            <div class="text-muted mt-3 flex items-center gap-4 text-xs">
              <div class="flex items-center gap-1">
                <UIcon name="i-hugeicons-checkmark-circle-01" class="size-4" />
                <span>Terminé</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-hugeicons-clock-04" class="size-4" />
                <span>{{ plan.numberOfSessions }} séances</span>
              </div>
            </div>
          </UCard>
        </template>
      </UCollapsible>
    </aside>

    <!-- Right Column (2/3) -->
    <section class="lg:col-span-2">
      <AppCard
        icon="i-hugeicons-task-01"
        :description="`${consultationCount} Séances enregistrées ${selectedPlan && selectedPlan.progress ? '• Progression: ' + selectedPlan.progress + '%' : ''}`"
      >
        <!-- Header -->
        <template #title>
          <span>{{ selectedPlanTitle }}</span>
          <UBadge
            v-if="selectedPlan?.status"
            :color="getTreatmentPlanStatusColor(selectedPlan?.status)"
            variant="subtle"
            size="sm"
            class="font-bold tracking-wide uppercase"
          >
            {{ getTreatmentPlanStatusLabel(selectedPlan?.status) }}
          </UBadge>
        </template>
        <template #actions>
          <UButton icon="i-lucide-plus" color="primary" size="sm" @click="openCreateSessionSlideover">
            Nouvelle Séance
          </UButton>
        </template>

        <!-- Search -->
        <div class="mb-4 flex w-full gap-4">
          <UInput
            v-model="searchQuery"
            placeholder="Rechercher une note, une date..."
            icon="i-lucide-search"
            class="w-full"
          />

          <UButton
            icon="i-lucide-filter"
            variant="outline"
            size="sm"
            color="neutral"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            Filtrer
          </UButton>
        </div>

        <!-- Filter Bar (expandable) -->

        <Transition name="fade">
          <div v-if="showAdvancedFilters" class="bg-muted mb-4 flex justify-between gap-4 rounded-lg p-4">
            <UFormField label="Statut" class="w-full">
              <USelect
                v-model="statusFilter"
                :items="[
                  ...SESSION_STATUS_OPTIONS,
                  {
                    label: 'Tous',
                    value: 'all',
                    color: 'neutral'
                  }
                ]"
                placeholder="Tous les statuts"
                class="w-full"
              />
            </UFormField>

            <div class="flex items-center gap-2">
              <UFormField label="Du">
                <UInput v-model="dateFrom" type="date" />
              </UFormField>
              <UFormField label="Au">
                <UInput v-model="dateTo" type="date" />
              </UFormField>
            </div>
          </div>
        </Transition>

        <!-- Session List -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-muted animate-spin text-4xl" />
        </div>

        <div v-else-if="filteredConsultations.length > 0" class="space-y-3">
          <ConsultationCard
            v-for="consultation in filteredConsultations"
            :key="consultation.id"
            :consultation="consultation"
            @edit="handleEditSession"
            @delete="handleDeleteSession"
          />
        </div>

        <UEmpty
          v-else
          icon="i-lucide-calendar-x"
          title="Aucune séance"
          :description="
            searchQuery || statusFilter !== 'all' || dateFrom || dateTo
              ? 'Aucune séance ne correspond à vos critères de recherche.'
              : 'Commencez par créer une nouvelle séance.'
          "
          :ui="{ body: 'max-w-none' }"
          :actions="[
            {
              label: 'Créer une séance',
              icon: 'i-lucide-plus',
              color: 'primary',
              onClick: openCreateSessionSlideover
            }
          ]"
        />
      </AppCard>
    </section>
  </div>
</template>
