<script setup lang="ts">
  import CreateTreatmentPlanSlideover from './CreateTreatmentPlanSlideover.vue'

  const treatmentPlan: TreatmentPlan = {
    id: '1',
    organizationId: 'org_1',
    patientId: 'pat_1',
    therapistId: 'therapist_1',
    title: 'Rééducation épaule droite',
    diagnosis: 'Tendinopathie du supra-épineux avec calcification',
    objective: "Améliorer l'amplitude articulaire, réduire la douleur nocturne et renforcer la coiffe des rotateurs.",
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-11-30'),
    numberOfSessions: 15,
    sessionFrequency: 2,
    status: 'ongoing',
    prescribingDoctor: 'Dr. Leblanc',
    prescriptionDate: new Date('2024-09-15'),
    painLevel: 4,
    coverageStatus: 'covered',
    insuranceInfo: 'Mutuelle SantéPlus (Prise en charge OK)',
    notes: [
      {
        date: new Date(),
        author: 'Dr. Martin',
        content: 'Suite à une chute, diagnostic de tendinopathie du supra-épineux avec calcification.'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  }

  const sessions: Consultation[] = [
    {
      id: '1',
      organizationId: 'org_1',
      patientId: 'pat_1',
      treatmentPlanId: '1',
      date: new Date('2024-10-15'),
      startTime: '10:00',
      endTime: '10:45',
      duration: 45,
      sessionType: 'initial',
      chiefComplaint: 'Douleur épaule droite',
      sessionNotes: 'Bilan initial effectué',
      treatmentPlanSummary: 'Évaluation et plan de traitement',
      observations: 'Limitation de la mobilité',
      nextSteps: 'Renforcement et mobilisation',
      painLevelBefore: 6,
      painLevelAfter: 4,
      progressNotes: 'Amélioration notable de la mobilité en abduction.',
      therapistId: 'therapist_1',
      therapistNotes: 'Patient motivé',
      status: 'completed',
      billed: false,
      insuranceClaimed: false,
      sessionCost: 5000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      organizationId: 'org_1',
      patientId: 'pat_1',
      treatmentPlanId: '1',
      date: new Date('2024-10-18'),
      startTime: '11:00',
      endTime: '11:30',
      duration: 30,
      sessionType: 'follow_up',
      chiefComplaint: 'Suivi rééducation',
      sessionNotes: 'Renforcement',
      treatmentPlanSummary: 'Exercices de renforcement',
      observations: 'Bonne progression',
      nextSteps: 'Continuer le programme',
      painLevelBefore: 4,
      painLevelAfter: 3,
      progressNotes: null,
      therapistId: 'therapist_1',
      therapistNotes: null,
      status: 'scheduled',
      billed: false,
      insuranceClaimed: false,
      sessionCost: 4000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      organizationId: 'org_1',
      patientId: 'pat_1',
      treatmentPlanId: '1',
      date: new Date('2024-10-22'),
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      sessionType: 'follow_up',
      chiefComplaint: 'Suivi rééducation',
      sessionNotes: 'Thérapie manuelle',
      treatmentPlanSummary: 'Mobilisation et thérapie manuelle',
      observations: 'Douleur résiduelle à la palpation',
      nextSteps: 'Continuer la thérapie manuelle',
      painLevelBefore: 3,
      painLevelAfter: 2,
      progressNotes: null,
      therapistId: 'therapist_1',
      therapistNotes: null,
      status: 'scheduled',
      billed: false,
      insuranceClaimed: false,
      sessionCost: 4000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      organizationId: 'org_1',
      patientId: 'pat_1',
      treatmentPlanId: '1',
      date: new Date('2024-10-12'),
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      sessionType: 'follow_up',
      chiefComplaint: 'Suivi rééducation',
      sessionNotes: 'Mobilisation',
      treatmentPlanSummary: 'Exercices de mobilisation',
      observations: null,
      nextSteps: null,
      painLevelBefore: 5,
      painLevelAfter: null,
      progressNotes: null,
      therapistId: 'therapist_1',
      therapistNotes: null,
      status: 'no_show',
      billed: false,
      insuranceClaimed: false,
      sessionCost: 4000,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const documents: PatientDocument[] = [
    {
      id: '1',
      patientId: 'pat_1',
      organizationId: 'org_1',
      uploadedById: 'therapist_1',
      treatmentPlanId: '1',
      fileName: 'Radio_Epaule_Post-Chute.pdf',
      originalFileName: 'Radio_Epaule_Post-Chute.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048576,
      storageKey: 'orgs/org_1/patients/pat_1/doc_1.pdf',
      category: 'imaging',
      description: 'Radio post-chute épaule droite',
      createdAt: new Date('2024-10-02'),
      updatedAt: new Date('2024-10-02'),
      deletedAt: null
    },
    {
      id: '2',
      patientId: 'pat_1',
      organizationId: 'org_1',
      uploadedById: 'therapist_1',
      treatmentPlanId: '1',
      fileName: 'Rapport_Medecin_Traitant.docx',
      originalFileName: 'Rapport_Medecin_Traitant.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1024000,
      storageKey: 'orgs/org_1/patients/pat_1/doc_2.docx',
      category: 'treatment_notes',
      description: 'Rapport du médecin traitant',
      createdAt: new Date('2024-10-01'),
      updatedAt: new Date('2024-10-01'),
      deletedAt: null
    },
    {
      id: '3',
      patientId: 'pat_1',
      organizationId: 'org_1',
      uploadedById: 'therapist_1',
      treatmentPlanId: '1',
      fileName: 'Ordonnance_Antalgiques.png',
      originalFileName: 'Ordonnance_Antalgiques.png',
      mimeType: 'image/png',
      fileSize: 512000,
      storageKey: 'orgs/org_1/patients/pat_1/doc_3.png',
      category: 'prescriptions',
      description: 'Ordonnance antalgiques',
      createdAt: new Date('2024-10-01'),
      updatedAt: new Date('2024-10-01'),
      deletedAt: null
    }
  ]

  const notes = [
    {
      id: '1',
      session: 'Séance 5',
      content: 'Amélioration notable de la mobilité en abduction.',
      author: 'Dr. Martin',
      date: '15 Oct. 2024'
    },
    {
      id: '2',
      session: 'Séance 4',
      content: 'Douleur résiduelle à la palpation du tendon.',
      author: 'Dr. Martin',
      date: '12 Oct. 2024'
    }
  ]

  const newNote = ref('')

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

  function addNote() {
    if (newNote.value.trim()) {
      // In a real app, this would save to the API
      newNote.value = ''
    }
  }

  const props = defineProps<{ patient?: Patient }>()

  const createSlideoverOpen = ref(false)

  function handleTreatmentPlanCreated(plan: any) {
    console.log('Treatment plan created:', plan)
    // Refresh data or update UI
    createSlideoverOpen.value = false
  }
</script>

<template>
  <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left Column -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <!-- Treatment Plan Card -->
      <UCard>
        <div class="mb-4 flex items-start justify-between">
          <h2 class="text-lg font-bold">{{ treatmentPlan.title }}</h2>
          <UBadge color="success" variant="soft" class="rounded-full">Actif</UBadge>
        </div>
        <div class="text-muted space-y-3 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-toned" />
            <span>
              Début: {{ treatmentPlan.startDate.toLocaleDateString('fr-FR') }} - Fin:
              {{ treatmentPlan.endDate?.toLocaleDateString('fr-FR') }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="text-toned" />
            <span>Thérapeute: {{ treatmentPlan.therapistId }}</span>
          </div>
        </div>
        <div class="mt-5">
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>
              Progression ({{ sessions.filter((s) => s.status === 'completed').length }}/{{
                treatmentPlan.numberOfSessions
              }}
              séances)
            </span>
            <span>
              {{
                Math.round(
                  (sessions.filter((s) => s.status === 'completed').length / (treatmentPlan.numberOfSessions || 1)) *
                    100
                )
              }}%
            </span>
          </div>
          <UProgress
            :model-value="
              Math.round(
                (sessions.filter((s) => s.status === 'completed').length / (treatmentPlan.numberOfSessions || 1)) * 100
              )
            "
          />
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <UButton icon="i-lucide-edit" variant="outline" color="neutral" size="md" class="flex-1">Modifier</UButton>
          <UButton icon="i-lucide-archive" variant="outline" color="neutral" size="md" class="flex-1">Clôturer</UButton>
          <UButton icon="i-lucide-plus" color="primary" size="md" class="flex-1" @click="createSlideoverOpen = true">
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
                <p class="text-muted text-sm">{{ treatmentPlan.objective }}</p>
              </div>
              <div>
                <h4 class="mb-2 text-sm font-semibold">Diagnostic</h4>
                <p class="text-muted text-sm">{{ treatmentPlan.diagnosis }}</p>
              </div>
              <div v-if="treatmentPlan.painLevel">
                <h4 class="mb-2 text-sm font-semibold">Niveau de douleur (actuel)</h4>
                <div class="flex items-center gap-3">
                  <USlider :model-value="treatmentPlan.painLevel" :max="10" :min="0" disabled />
                  <span class="font-semibold">{{ treatmentPlan.painLevel }}/10</span>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <h4 class="font-semibold">Fréquence</h4>
                  <p class="text-muted">{{ treatmentPlan.sessionFrequency }}x / semaine</p>
                </div>
                <div>
                  <h4 class="font-semibold">Médecin prescripteur</h4>
                  <p class="text-muted">{{ treatmentPlan.prescribingDoctor }}</p>
                </div>
                <div>
                  <h4 class="font-semibold">Assurance</h4>
                  <p class="text-muted">{{ treatmentPlan.insuranceInfo }}</p>
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
          <UButton icon="i-lucide-plus" color="primary" size="sm" square label="Séance" />
        </div>
        <div class="overflow-x-auto">
          <UTable
            :data="sessions"
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
            <template #date-cell="{ row }">
              <span class="text-sm">
                {{ row.original.date.toLocaleDateString('fr-FR') }}, {{ row.original.startTime }}
              </span>
            </template>
            <template #type-cell="{ row }">
              <span class="text-muted text-sm">{{ row.original.sessionType }}</span>
            </template>
            <template #duration-cell="{ row }">
              <span class="text-muted text-sm">{{ row.original.duration }} min</span>
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="getSessionStatusColor(row.getValue('status'))" variant="soft" size="md">
                {{ getSessionStatusLabel(row.getValue('status')) }}
              </UBadge>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center justify-end gap-2">
                <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="sm" square />
                <UButton
                  v-if="row.original.status === 'scheduled'"
                  icon="i-lucide-x"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                />
                <UButton
                  v-else-if="row.original.status === 'completed'"
                  icon="i-lucide-plus"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  square
                />
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
            <div v-for="note in notes" :key="note.id" class="text-sm">
              <p>
                <strong class="font-semibold">{{ note.session }}:</strong>
                {{ note.content }}
              </p>
              <p class="text-muted text-xs">{{ note.author }} - {{ note.date }}</p>
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
            <div v-for="doc in documents" :key="doc.id" class="flex items-center justify-between py-3">
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
                    Téléversé le {{ doc.createdAt.toLocaleDateString('fr-FR') }} par {{ doc.uploadedById }}
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
  <CreateTreatmentPlanSlideover
    v-if="props.patient"
    :patient="props.patient"
    :open="createSlideoverOpen"
    @update:open="createSlideoverOpen = $event"
    @created="handleTreatmentPlanCreated"
  />
</template>
