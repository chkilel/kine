<script setup lang="ts">
  import { LazyTreatmentPlanCreateSideover, LazyConsultaionPlanningSlideover } from '#components'
  import { useConsultations } from '~/composables/useConsultations'

  const props = defineProps<{ patient: Patient }>()

  const toast = useToast()
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyConsultaionPlanningSlideover)
  const treatmentPlanCreateOverlay = overlay.create(LazyTreatmentPlanCreateSideover)

  const { fetchTreatmentPlanConsultations, deleteConsultation: deleteConsultationFromComposable } = useConsultations()

  // Treatment plans API call
  const {
    data: treatmentPlans,
    pending: loading,
    error,
    refresh: refreshTreatmentPlans
  } = useFetch(`/api/patients/${props.patient?.id}/treatment-plans`)

  // Computed properties for treatment plan data
  const getActiveTreatmentPlan = computed(() => {
    const plans = treatmentPlans.value || []
    return plans.find((plan: any) => plan.status === 'active') || plans[0]
  })

  const formatTreatmentPlanStatus = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'success', label: 'Actif' }
      case 'completed':
        return { color: 'info', label: 'Terminé' }
      case 'paused':
        return { color: 'warning', label: 'En pause' }
      case 'cancelled':
        return { color: 'error', label: 'Annulé' }
      default:
        return { color: 'neutral', label: status }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTherapistName = (therapist: any) => {
    if (!therapist) return 'Non assigné'
    return `${therapist.firstName} ${therapist.lastName}`.trim() || 'Thérapeute'
  }

  // Consultations data
  const consultations = ref<any[]>([])
  const consultationsLoading = ref(false)
  const consultationsError = ref<any>(null)

  // Fetch consultations for active treatment plan
  const fetchConsultations = async () => {
    const planId = getActiveTreatmentPlan.value?.id
    if (!planId) return

    consultationsLoading.value = true
    consultationsError.value = null

    try {
      const result = await fetchTreatmentPlanConsultations(planId)
      consultations.value = result.consultations
    } catch (error) {
      consultationsError.value = error
    } finally {
      consultationsLoading.value = false
    }
  }

  // Watch for active treatment plan changes and fetch consultations
  watch(
    getActiveTreatmentPlan,
    () => {
      fetchConsultations()
    },
    { immediate: true }
  )

  // Refresh consultations data
  const refreshConsultations = async () => {
    await fetchConsultations()
    toast.add({
      title: 'Consultations actualisées',
      description: 'Les consultations ont été rechargées avec succès.',
      color: 'success'
    })
  }

  // Helper functions for consultation display (consistent with consultation planning)
  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'scheduled':
        return 'info'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'in_progress':
        return 'warning'
      case 'no_show':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getSessionStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée'
      case 'scheduled':
        return 'À venir'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      case 'in_progress':
        return 'En cours'
      case 'no_show':
        return 'Absence'
      default:
        return status
    }
  }

  // Delete consultation function
  const deleteConsultation = async (consultationId: string) => {
    if (!props.patient) return

    const success = await deleteConsultationFromComposable(props.patient.id, consultationId)

    if (success) {
      await fetchConsultations()
    }
  }

  // Edit consultation function - opens planning slideover with consultation data

  // Function to open session planning with event handlers
  function openSessionPlanning() {
    sessionPlanningOverlay.open({
      patient: props.patient as any,
      treatmentPlan: getActiveTreatmentPlan.value
        ? (getActiveTreatmentPlan.value as unknown as TreatmentPlan)
        : undefined
    })
  }

  // Retry fetch with user feedback
  async function retryFetch() {
    try {
      await refreshTreatmentPlans()
      toast.add({
        title: 'Données actualisées',
        description: 'Les plans de traitement ont été rechargés avec succès.',
        color: 'success'
      })
    } catch (err: any) {
      toast.add({
        title: 'Erreur de chargement',
        description: 'Impossible de recharger les données. Veuillez réessayer plus tard.',
        color: 'error'
      })
    }
  }

  // Open create slideover with user feedback
  async function openCreateSlideover() {
    treatmentPlanCreateOverlay.open({
      patient: props.patient
    })
  }

  function getDocumentIcon(category: string) {
    switch (category) {
      case 'imaging':
        return 'i-lucide-image'
      case 'treatment_notes':
        return 'i-lucide-file-text'
      case 'prescriptions':
        return 'i-lucide-pill'
      default:
        return 'i-lucide-file-text'
    }
  }

  function getDocumentColor(category: string) {
    switch (category) {
      case 'imaging':
        return 'primary'
      case 'treatment_notes':
        return 'info'
      case 'prescriptions':
        return 'secondary'
      default:
        return 'neutral'
    }
  }

  // Notes and documents state
  const newNote = ref('')
  const documents = ref<any[]>([])

  function addNote() {
    if (newNote.value.trim()) {
      // In a real app, this would save to the API
      console.log('Adding note:', newNote.value)
      newNote.value = ''
    }
  }
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="mt-6 flex items-center justify-center py-12">
    <div class="flex items-center gap-3">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
      <span class="text-muted">Chargement des plans de traitement...</span>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="error" class="mt-6">
    <UAlert color="error" icon="i-lucide-alert-circle" title="Erreur de chargement">
      <template #description>
        {{ error.data?.message || error.message || 'Failed to fetch treatment plans' }}
        <UButton @click="retryFetch()" variant="link" color="error" size="sm" class="ml-2">Réessayer</UButton>
      </template>
    </UAlert>
  </div>

  <!-- Empty State -->
  <div v-else-if="!getActiveTreatmentPlan" class="mt-6">
    <UEmpty
      icon="i-lucide-clipboard-plus"
      title="Aucun plan de traitement"
      description="Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
      :actions="[{ label: 'Créer un plan', icon: 'i-lucide-plus', color: 'primary', onClick: openCreateSlideover }]"
    />
  </div>

  <!-- Treatment Plan Content -->
  <div v-else class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <!-- Treatment Plan Card -->
      <UCard>
        <div class="mb-4 flex items-start justify-between">
          <h2 class="text-lg font-bold">{{ getActiveTreatmentPlan.title }}</h2>
          <UBadge
            :color="formatTreatmentPlanStatus(getActiveTreatmentPlan.status).color"
            variant="soft"
            class="rounded-full"
          >
            {{ formatTreatmentPlanStatus(getActiveTreatmentPlan.status).label }}
          </UBadge>
        </div>
        <div class="text-muted space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-toned" />
            <span>
              Début: {{ formatDate(getActiveTreatmentPlan.startDate) }} - Fin:
              {{ getActiveTreatmentPlan.endDate ? formatDate(getActiveTreatmentPlan.endDate) : 'Non définie' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="text-toned" />
            <span>Thérapeute: {{ getTherapistName(getActiveTreatmentPlan.therapist) }}</span>
          </div>
        </div>
        <div class="mt-5">
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>
              Progression ({{ getActiveTreatmentPlan.completedConsultations || 0 }}/{{
                getActiveTreatmentPlan.numberOfSessions || 0
              }}
              séances)
            </span>
            <span>{{ getActiveTreatmentPlan.progress || 0 }}%</span>
          </div>
          <UProgress :model-value="getActiveTreatmentPlan.progress || 0" size="lg" />
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <UButton icon="i-lucide-edit" variant="outline" color="neutral" size="md" class="flex-1">Modifier</UButton>
          <UButton icon="i-lucide-archive" variant="outline" color="neutral" size="md" class="flex-1">Clôturer</UButton>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            size="md"
            class="flex-1 justify-center sm:justify-start"
            @click="openCreateSlideover"
          >
            Nouveau
          </UButton>
        </div>
      </UCard>

      <!-- Treatment Plan Details -->
      <UCard
        :ui="{
          body: 'p-0 sm:p-0'
        }"
      >
        <UCollapsible default-open>
          <UButton
            color="neutral"
            variant="ghost"
            class="group p-4 sm:p-6"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            trailing-icon="i-lucide-chevron-down"
            block
          >
            <h3 class="text-base font-bold">Détails du plan</h3>
          </UButton>

          <template #content>
            <div class="border-default space-y-5 border-t p-4 sm:p-6">
              <div>
                <h4 class="mb-2 text-sm font-semibold">Objectifs thérapeutiques</h4>
                <p class="text-muted text-sm">{{ getActiveTreatmentPlan.objective || 'Non spécifié' }}</p>
              </div>
              <div>
                <h4 class="mb-2 text-sm font-semibold">Diagnostic</h4>
                <p class="text-muted text-sm">{{ getActiveTreatmentPlan.diagnosis || 'Non spécifié' }}</p>
              </div>
              <div v-if="getActiveTreatmentPlan.painLevel">
                <h4 class="mb-2 text-sm font-semibold">Niveau de douleur (actuel)</h4>
                <div class="flex items-center gap-3">
                  <USlider :model-value="getActiveTreatmentPlan.painLevel" :max="10" :min="0" disabled />
                  <span class="font-semibold">{{ getActiveTreatmentPlan.painLevel }}/10</span>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <h4 class="font-semibold">Fréquence</h4>
                  <p class="text-muted">{{ getActiveTreatmentPlan.sessionFrequency || 0 }}x / semaine</p>
                </div>
                <div>
                  <h4 class="font-semibold">Médecin prescripteur</h4>
                  <p class="text-muted">{{ getActiveTreatmentPlan.prescribingDoctor || 'Non spécifié' }}</p>
                </div>
                <div>
                  <h4 class="font-semibold">Assurance</h4>
                  <p class="text-muted">{{ getActiveTreatmentPlan.insuranceInfo || 'Non spécifié' }}</p>
                </div>
              </div>
            </div>
          </template>
        </UCollapsible>
      </UCard>
    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Sessions Overview -->
      <UCard>
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-bold">Aperçu des séances</h3>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              variant="outline"
              color="neutral"
              size="sm"
              :loading="consultationsLoading"
              @click="refreshConsultations()"
            >
              Actualiser
            </UButton>
            <UButton icon="i-lucide-calendar-plus" color="primary" size="sm" @click="openSessionPlanning()">
              Planifier les séances
            </UButton>
          </div>
        </div>
        <div class="overflow-x-auto">
          <UTable
            :data="consultations"
            :loading="consultationsLoading"
            :columns="[
              { accessorKey: 'date', header: 'Date & Heure' },
              { accessorKey: 'type', header: 'Type' },
              { accessorKey: 'duration', header: 'Durée' },
              { accessorKey: 'location', header: 'Lieu' },
              { accessorKey: 'status', header: 'Statut' },
              { id: 'actions', header: 'Actions' }
            ]"
            :ui="{
              thead: 'bg-muted'
            }"
          >
            <template #date-cell="{ row }">
              <div>
                <div class="font-medium">
                  {{
                    new Date(row.original.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })
                  }}
                </div>
                <div class="text-muted-foreground text-sm">{{ row.original.startTime || '' }}</div>
              </div>
            </template>

            <template #type-cell="{ row }">
              <div>
                <div class="font-medium">
                  {{
                    row.original.type === 'initial'
                      ? 'Évaluation initiale'
                      : row.original.type === 'follow_up'
                        ? 'Suivi'
                        : row.original.type === 'evaluation'
                          ? 'Évaluation'
                          : row.original.type === 'discharge'
                            ? 'Sortie'
                            : row.original.type === 'mobilization'
                              ? 'Mobilisation'
                              : row.original.type === 'reinforcement'
                                ? 'Renforcement'
                                : row.original.type === 'reeducation'
                                  ? 'Rééducation'
                                  : row.original.type || ''
                  }}
                </div>
                <div class="text-muted-foreground text-sm">{{ row.original.chiefComplaint || '' }}</div>
              </div>
            </template>

            <template #duration-cell="{ row }">
              <div class="text-sm">
                {{ row.original.duration ? `${row.original.duration} min` : '-' }}
              </div>
            </template>

            <template #location-cell="{ row }">
              <div class="text-sm">
                {{
                  row.original.location === 'clinic'
                    ? 'Cabinet'
                    : row.original.location === 'home'
                      ? 'Domicile'
                      : row.original.location === 'telehealth'
                        ? 'Téléconsultation'
                        : row.original.location || '-'
                }}
              </div>
            </template>

            <template #status-cell="{ row }">
              <UBadge :color="getSessionStatusColor(row.original.status)" variant="soft" size="xs">
                {{ getSessionStatusLabel(row.original.status) }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center justify-end gap-2">
                <UButton icon="i-lucide-edit" variant="ghost" color="neutral" size="sm" square />
                <UButton
                  icon="i-lucide-trash"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                  @click="deleteConsultation(row.original.id)"
                />
              </div>
            </template>

            <template #empty>
              <div class="px-4 py-8 text-center">
                <div class="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                  <UIcon name="i-lucide-calendar-x" class="text-primary text-3xl" />
                </div>
                <h3 class="text-default mt-4 text-lg font-semibold">
                  Aucune séance planifiée pour ce plan de traitement.
                </h3>
                <p class="text-muted mt-2 text-sm">
                  Commencez à planifier les séances pour ce patient afin de débuter le suivi.
                </p>
                <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <UButton icon="i-lucide-plus-circle" color="primary" size="md" @click="openSessionPlanning()">
                    Planifier les séances du plan
                  </UButton>
                  <UButton icon="i-lucide-plus" variant="outline" color="neutral" size="md">
                    Créer une consultation indépendante
                  </UButton>
                </div>
              </div>
            </template>
          </UTable>
        </div>
      </UCard>

      <!-- Notes & Follow-up -->
      <UCard>
        <h3 class="mb-5 text-base font-bold">Notes &amp; Suivi</h3>
        <div class="space-y-4">
          <div>
            <UTextarea
              v-model="newNote"
              autoresize
              placeholder="Ajouter une note de suivi..."
              :rows="3"
              class="block"
            />
            <UButton @click="addNote" color="primary" size="sm" class="mt-2">Ajouter la note</UButton>
          </div>
          <div class="border-default space-y-3 border-t pt-4">
            <div v-if="!(getActiveTreatmentPlan.notes as any[])?.length" class="py-4 text-center">
              <p class="text-muted text-sm">Aucune note de suivi pour ce plan de traitement</p>
            </div>
            <div
              v-else
              v-for="(note, index) in (getActiveTreatmentPlan.notes as any[]) || []"
              :key="index"
              class="text-sm"
            >
              <p>
                <strong class="font-semibold">
                  {{ note.date ? new Date(note.date).toLocaleDateString('fr-FR') : 'Date non spécifiée' }}:
                </strong>
                {{ note.content || '' }}
              </p>
              <p class="text-muted text-xs">{{ note.author || 'Auteur inconnu' }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Documents -->
      <UCard>
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-bold">Documents du plan de traitement</h3>
          <UButton icon="i-lucide-plus" color="primary" size="sm">Ajouter un document</UButton>
        </div>
        <div class="space-y-4">
          <UFileUpload
            label="Glissez-déposez un fichier ou"
            description="cliquez pour téléverser"
            class="hover:bg-elevated min-h-24 w-full"
          />

          <div class="divide-default divide-y">
            <div v-if="!documents?.length" class="py-4 text-center">
              <p class="text-muted text-sm">Aucun document pour ce plan de traitement</p>
            </div>
            <div v-else v-for="doc in documents" :key="doc.id" class="flex items-center justify-between py-3">
              <div class="flex items-center gap-4">
                <UBadge
                  :icon="getDocumentIcon(doc.category)"
                  :color="getDocumentColor(doc.category)"
                  variant="soft"
                  size="lg"
                  square
                />
                <div>
                  <p class="font-semibold">{{ doc.originalFileName }}</p>
                  <p class="text-muted text-xs">
                    Téléversé le {{ new Date(doc.createdAt).toLocaleDateString('fr-FR') }} par {{ doc.uploadedById }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="sm" square />
                <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" square />
                <UButton icon="i-lucide-trash" variant="ghost" color="error" size="sm" square />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
