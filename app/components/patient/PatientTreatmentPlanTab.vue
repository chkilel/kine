<script setup lang="ts">
  import { LazyPatientCreateTreatmentPlanSlideover, LazyPatientSessionPlanningSlideover } from '#components'

  const props = defineProps<{ patient?: Patient }>()
  const createSlideoverOpen = ref(false)

  // Use Nuxt UI's useToast for notifications
  const toast = useToast()

  // Use Nuxt's useFetch composable for reactive data fetching
  const {
    data: treatmentPlans,
    pending: loading,
    error,
    refresh: refreshTreatmentPlans
  } = await useFetch(`/api/patients/${props.patient?.id}/treatment-plans`, {
    key: `treatment-plans-${props.patient?.id}`,
    server: false, // Fetch on client-side to ensure we have patient context
    default: () => [],
    transform: (data: any) => data || []
  })

  // Get the active treatment plan (first one, or most recent)
  const activeTreatmentPlan = computed(() => {
    if (!treatmentPlans.value?.length) return null
    return treatmentPlans.value[0] // API returns ordered by newest first
  })

  // Use useOverlay for session planning slideover
  const overlay = useOverlay()
  const sessionPlanningOverlay = overlay.create(LazyPatientSessionPlanningSlideover)

  // Function to open session planning with event handlers
  function openSessionPlanning() {
    const instance = sessionPlanningOverlay.open({
      patient: props.patient as any,
      treatmentPlan: activeTreatmentPlan.value
        ? {
            id: activeTreatmentPlan.value.id,
            title: activeTreatmentPlan.value.title,
            totalSessions: activeTreatmentPlan.value.numberOfSessions || 20,
            completedSessions: activeTreatmentPlan.value.completedConsultations || 0,
            remainingSessions:
              (activeTreatmentPlan.value.numberOfSessions || 20) -
              (activeTreatmentPlan.value.completedConsultations || 0),
            treatmentType: activeTreatmentPlan.value.diagnosis || 'Rééducation',
            progress: activeTreatmentPlan.value.progress || 0
          }
        : undefined
    })

    // Handle the close event with data
    instance.then((result: any) => {
      if (result) {
        // Handle different types of results based on the action
        if (result.type === 'session-created') {
          toast.add({
            title: 'Séance créée',
            description: 'La séance a été ajoutée au plan de traitement.',
            color: 'success'
          })
        } else if (result.type === 'sessions-updated') {
          toast.add({
            title: 'Séances mises à jour',
            description: 'Les séances ont été mises à jour avec succès.',
            color: 'success'
          })
        } else if (result.type === 'sessions-generated') {
          toast.add({
            title: 'Séances générées',
            description: `${result.data?.length || 0} séances ont été générées avec succès.`,
            color: 'success'
          })
        }
      }
    })
  }

  // Handle treatment plan creation
  function handleTreatmentPlanCreated(plan: any) {
    console.log('Treatment plan created:', plan)
    // Show success notification
    toast.add({
      title: 'Plan de traitement créé',
      description: `Le plan "${plan.title}" a été créé avec succès.`,
      color: 'success'
    })
    // Refresh data after creating a new plan
    refreshTreatmentPlans()
    createSlideoverOpen.value = false
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
  function openCreateSlideover() {
    createSlideoverOpen.value = true
    toast.add({
      title: 'Création de plan',
      description: 'Ouvrez le formulaire pour créer un nouveau plan de traitement.',
      duration: 2000,
      color: 'info'
    })
  }

  // Helper functions
  function getSessionStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'success'
      case 'scheduled':
        return 'warning'
      case 'no_show':
        return 'error'
      default:
        return 'neutral'
    }
  }

  function getSessionStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'scheduled':
        return 'À venir'
      case 'no_show':
        return 'Manquée'
      default:
        return status
    }
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

  // Get therapist display name
  function getTherapistName(therapist: any) {
    if (!therapist) return 'Non assigné'
    return `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || therapist.email || 'Non assigné'
  }

  // Get status badge color and label
  function getStatusInfo(status: string) {
    switch (status) {
      case 'ongoing':
        return { color: 'success' as const, label: 'Actif' }
      case 'completed':
        return { color: 'neutral' as const, label: 'Terminé' }
      case 'paused':
        return { color: 'warning' as const, label: 'En pause' }
      case 'cancelled':
        return { color: 'error' as const, label: 'Annulé' }
      default:
        return { color: 'neutral' as const, label: status }
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
  <div v-else-if="!activeTreatmentPlan" class="mt-6">
    <UEmpty
      icon="i-lucide-clipboard-plus"
      title="Aucun plan de traitement"
      description="Ce patient n'a pas encore de plan de traitement. Créez-en un pour commencer le suivi."
      :actions="[{ label: 'Créer un plan', icon: 'i-lucide-plus', color: 'primary' }]"
      @action="openCreateSlideover"
    />
  </div>

  <!-- Treatment Plan Content -->
  <div v-else class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <!-- Treatment Plan Card -->
      <UCard>
        <div class="mb-4 flex items-start justify-between">
          <h2 class="text-lg font-bold">{{ activeTreatmentPlan.title }}</h2>
          <UBadge :color="getStatusInfo(activeTreatmentPlan.status).color" variant="soft" class="rounded-full">
            {{ getStatusInfo(activeTreatmentPlan.status).label }}
          </UBadge>
        </div>
        <div class="text-muted space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-toned" />
            <span>
              Début: {{ new Date(activeTreatmentPlan.startDate).toLocaleDateString('fr-FR') }} - Fin:
              {{
                activeTreatmentPlan.endDate
                  ? new Date(activeTreatmentPlan.endDate).toLocaleDateString('fr-FR')
                  : 'Non définie'
              }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="text-toned" />
            <span>Thérapeute: {{ getTherapistName(activeTreatmentPlan.therapist) }}</span>
          </div>
        </div>
        <div class="mt-5">
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>
              Progression ({{ activeTreatmentPlan.completedConsultations || 0 }}/{{
                activeTreatmentPlan.numberOfSessions || 0
              }}
              séances)
            </span>
            <span>{{ activeTreatmentPlan.progress || 0 }}%</span>
          </div>
          <UProgress :model-value="activeTreatmentPlan.progress || 0" size="lg" />
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <UButton icon="i-lucide-edit" variant="outline" color="neutral" size="md" class="flex-1">Modifier</UButton>
          <UButton icon="i-lucide-archive" variant="outline" color="neutral" size="md" class="flex-1">Clôturer</UButton>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            size="md"
            class="flex-1 justify-center sm:justify-start"
            @click="createSlideoverOpen = true"
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
                <p class="text-muted text-sm">{{ activeTreatmentPlan.objective || 'Non spécifié' }}</p>
              </div>
              <div>
                <h4 class="mb-2 text-sm font-semibold">Diagnostic</h4>
                <p class="text-muted text-sm">{{ activeTreatmentPlan.diagnosis || 'Non spécifié' }}</p>
              </div>
              <div v-if="activeTreatmentPlan.painLevel">
                <h4 class="mb-2 text-sm font-semibold">Niveau de douleur (actuel)</h4>
                <div class="flex items-center gap-3">
                  <USlider :model-value="activeTreatmentPlan.painLevel" :max="10" :min="0" disabled />
                  <span class="font-semibold">{{ activeTreatmentPlan.painLevel }}/10</span>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <h4 class="font-semibold">Fréquence</h4>
                  <p class="text-muted">{{ activeTreatmentPlan.sessionFrequency || 0 }}x / semaine</p>
                </div>
                <div>
                  <h4 class="font-semibold">Médecin prescripteur</h4>
                  <p class="text-muted">{{ activeTreatmentPlan.prescribingDoctor || 'Non spécifié' }}</p>
                </div>
                <div>
                  <h4 class="font-semibold">Assurance</h4>
                  <p class="text-muted">{{ activeTreatmentPlan.insuranceInfo || 'Non spécifié' }}</p>
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
          <UButton icon="i-lucide-calendar-plus" color="primary" size="sm" @click="openSessionPlanning()">
            Planifier les séances
          </UButton>
        </div>
        <div class="overflow-x-auto">
          <UTable
            :data="[]"
            :columns="[
              { accessorKey: 'date', header: 'Date' },
              { accessorKey: 'type', header: 'Type' },
              { accessorKey: 'duration', header: 'Durée' },
              { accessorKey: 'status', header: 'Statut' },
              { id: 'actions', header: 'Actions' }
            ]"
            :ui="{
              thead: 'bg-muted'
            }"
          >
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
            <div v-if="!activeTreatmentPlan.notes?.length" class="py-4 text-center">
              <p class="text-muted text-sm">Aucune note de suivi pour ce plan de traitement</p>
            </div>
            <div v-else v-for="note in activeTreatmentPlan.notes" :key="note.id" class="text-sm">
              <p>
                <strong class="font-semibold">
                  {{ note.date ? new Date(note.date).toLocaleDateString('fr-FR') : 'Date non spécifiée' }}:
                </strong>
                {{ note.content }}
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

  <!-- Create Treatment Plan Slideover -->
  <LazyPatientCreateTreatmentPlanSlideover
    v-if="props.patient"
    :patient="props.patient"
    :open="createSlideoverOpen"
    @update:open="createSlideoverOpen = $event"
    @created="handleTreatmentPlanCreated"
  />
</template>
