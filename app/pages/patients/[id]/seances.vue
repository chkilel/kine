<script setup lang="ts">
  import { LazyAppModalConfirm, LazyConsultationPlanningSlideover } from '#components'
  import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'

  const route = useRoute()
  const router = useRouter()
  const { data: patient, isPending } = usePatientById(() => route.params.id as string)

  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyConsultationPlanningSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  // Mutating Data
  const { mutate: deleteConsultation } = useDeleteConsultation()

  const searchQuery = ref('')
  const statusFilter = ref<ConsultationStatus | 'all'>('all')
  const dateRange = shallowRef<{ start: DateValue | undefined; end: DateValue | undefined }>({
    start: undefined,
    end: undefined
  })

  const queryParams = computed(() => {
    const params: ConsultationQuery = {
      patientId: route.params.id as string,
      onlyIndependent: true
    }
    return params
  })

  const { data: consultations, isLoading } = useConsultationsList(queryParams)

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

    if (dateRange.value.start) {
      const startDate = dateRange.value.start.toString()
      filtered = filtered.filter((c) => c.date >= startDate)
    }
    if (dateRange.value.end) {
      const endDate = dateRange.value.end.toString()
      filtered = filtered.filter((c) => c.date <= endDate)
    }

    return filtered
  })

  const handleCreateSession = () => {
    if (!patient.value) return
    sessionPlanningOverlay.open({
      patient: patient.value
    })
  }

  const navigateToPlans = () => {
    navigateTo(`/patients/${route.params.id}/plan`)
  }

  const handleDeleteSession = async (consultation: Consultation) => {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la consultation',
      message: `Êtes-vous sûr de vouloir supprimer cette consultation du ${formatFrenchDate(consultation.date)} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-alert-02'
    })

    if (confirmed) {
      deleteConsultation({
        patientId: route.params.id as string,
        consultationId: consultation.id
      })
    }
  }

  const handleEditSession = (consultation: Consultation) => {
    if (!patient.value) return
    sessionPlanningOverlay.open({
      patient: patient.value,
      consultation: consultation
    })
  }

  const df = new DateFormatter('fr-FR', {
    dateStyle: 'medium'
  })
</script>
<template>
  <div v-if="isPending" class="flex justify-center py-8">
    <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
  </div>

  <div v-else-if="patient">
    <AppCard
      icon="hugeicons-folder-details"
      :description="`${consultationCount} Consultation${consultationCount > 1 ? 's' : ''} indépendante${consultationCount > 1 ? 's' : ''}`"
    >
      <!-- Header -->
      <template #title>
        <span>Consultations Indépendantes</span>
      </template>
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          label="Nouvelle Consultation"
          @click="handleCreateSession"
        />
      </template>

      <!-- Filter Bar (expandable) -->
      <div class="mb-4 flex justify-end gap-4">
        <UFormField class="min-w-36">
          <USelect
            v-model="statusFilter"
            :items="[
              {
                label: 'Tous',
                value: 'all',
                color: 'neutral'
              },
              ...SESSION_STATUS_OPTIONS
            ]"
            placeholder="Tous les statuts"
            class="w-full"
          />
        </UFormField>

        <UPopover
          :content="{
            align: 'end',
            side: 'bottom',
            sideOffset: 8
          }"
          class="min-w-64"
        >
          <UButton color="neutral" variant="subtle" icon="i-hugeicons-calendar-02">
            <template v-if="dateRange.start">
              <template v-if="dateRange.end">
                {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} -
                {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
              </template>

              <template v-else>
                {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
              </template>
            </template>
            <template v-else>Sélectionner une période</template>
          </UButton>

          <template #content>
            <UCalendar v-model="dateRange" class="p-2" :number-of-months="2" range />
          </template>
        </UPopover>
      </div>

      <!-- Session List -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="text-muted animate-spin text-4xl" />
      </div>

      <div v-else-if="filteredConsultations.length > 0" class="space-y-3">
        <ConsultationCard
          v-for="consultation in filteredConsultations"
          :key="consultation.id"
          :consultation="consultation"
          :can-edit="true"
          :can-delete="true"
          @edit="handleEditSession"
          @delete="handleDeleteSession"
        />
      </div>

      <!-- Empty State for Independent Consultations -->
      <UEmpty
        v-else-if="!searchQuery && statusFilter === 'all' && !dateRange.start && !dateRange.end"
        icon="hugeicons-folder-details"
        title="Aucune consultation indépendante"
        description="Toutes vos séances sont liées à des plans de traitement. Vous pouvez créer une consultation indépendante ou gérer vos plans existants."
        :ui="{ body: 'max-w-none' }"
        :actions="[
          {
            label: 'Créer une consultation',
            icon: 'i-lucide-plus',
            color: 'primary',
            onClick: handleCreateSession
          },
          {
            label: 'Voir les plans de traitement',
            icon: 'hugeicons-first-aid-kit',
            color: 'neutral',
            variant: 'outline',
            onClick: navigateToPlans
          }
        ]"
      />

      <!-- Empty State for Filters -->
      <UEmpty
        v-else
        icon="i-lucide-search-x"
        title="Aucune consultation trouvée"
        description="Aucune consultation ne correspond à vos critères de recherche."
        :ui="{ body: 'max-w-none' }"
      />
    </AppCard>
  </div>
</template>
