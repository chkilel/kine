<script setup lang="ts">
  import CreateTreatmentPlanSlideover from './CreateTreatmentPlanSlideover.vue'

  interface TreatmentPlan {
    id: string
    title: string
    objective: string
    status: 'active' | 'completed'
    progress: number
    completedSessions: number
    totalSessions: number
    startDate: string
    endDate: string
    therapist: string
    painLevel: number
    frequency: string
    prescribingDoctor: string
    insurance: string
    context: string
  }

  interface Session {
    id: string
    date: string
    time: string
    type: string
    duration: string
    status: 'completed' | 'upcoming' | 'missed'
  }

  interface Document {
    id: string
    name: string
    uploadDate: string
    uploadedBy: string
    type: 'radio' | 'report' | 'prescription'
  }

  interface Note {
    id: string
    session: string
    content: string
    author: string
    date: string
  }

  const treatmentPlan: TreatmentPlan = {
    id: '1',
    title: 'Rééducation épaule droite',
    objective: "Améliorer l'amplitude articulaire, réduire la douleur nocturne et renforcer la coiffe des rotateurs.",
    status: 'active',
    progress: 67,
    completedSessions: 10,
    totalSessions: 15,
    startDate: '01/10/2024',
    endDate: '30/11/2024',
    therapist: 'Dr. Martin',
    painLevel: 4,
    frequency: '2x / semaine (15 séances)',
    prescribingDoctor: 'Dr. Leblanc (15/09/2024)',
    insurance: 'Mutuelle SantéPlus (Prise en charge OK)',
    context: 'Suite à une chute, diagnostic de tendinopathie du supra-épineux avec calcification.'
  }

  const sessions: Session[] = [
    {
      id: '1',
      date: '15 Oct. 2024',
      time: '10:00',
      type: 'Bilan initial',
      duration: '45 min',
      status: 'completed'
    },
    {
      id: '2',
      date: '18 Oct. 2024',
      time: '11:00',
      type: 'Renforcement',
      duration: '30 min',
      status: 'upcoming'
    },
    {
      id: '3',
      date: '22 Oct. 2024',
      time: '10:00',
      type: 'Thérapie manuelle',
      duration: '30 min',
      status: 'upcoming'
    },
    {
      id: '4',
      date: '12 Oct. 2024',
      time: '09:00',
      type: 'Mobilisation',
      duration: '30 min',
      status: 'missed'
    }
  ]

  const documents: Document[] = [
    {
      id: '1',
      name: 'Radio_Epaule_Post-Chute.pdf',
      uploadDate: '02/10/2024',
      uploadedBy: 'Dr. Martin',
      type: 'radio'
    },
    {
      id: '2',
      name: 'Rapport_Medecin_Traitant.docx',
      uploadDate: '01/10/2024',
      uploadedBy: 'Dr. Martin',
      type: 'report'
    },
    {
      id: '3',
      name: 'Ordonnance_Antalgiques.png',
      uploadDate: '01/10/2024',
      uploadedBy: 'Dr. Martin',
      type: 'prescription'
    }
  ]

  const notes: Note[] = [
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
      case 'upcoming':
        return 'warning'
      case 'missed':
        return 'error'
      default:
        return 'neutral'
    }
  }

  function getSessionStatusLabel(status: string) {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'upcoming':
        return 'À venir'
      case 'missed':
        return 'Manquée'
      default:
        return status
    }
  }

  function getDocumentIcon(type: string) {
    switch (type) {
      case 'radio':
        return 'i-lucide-image'
      case 'report':
        return 'i-lucide-file-text'
      case 'prescription':
        return 'i-lucide-pill'
      default:
        return 'i-lucide-file-text'
    }
  }

  function getDocumentColor(type: string) {
    switch (type) {
      case 'radio':
        return 'primary'
      case 'report':
        return 'info'
      case 'prescription':
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

  const createSlideoverOpen = ref(false)

  const patient = {
    id: '1',
    name: 'Jean Dupont',
    birthDate: '01/01/1980'
  }

  function handleCreatePlan(plan: any) {
    console.log('Creating treatment plan:', plan)
    // In a real app, this would save to the API
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
            <span>Début: {{ treatmentPlan.startDate }} - Fin: {{ treatmentPlan.endDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="text-toned" />
            <span>Thérapeute: {{ treatmentPlan.therapist }}</span>
          </div>
        </div>
        <div class="mt-5">
          <div class="text-muted mb-1 flex items-center justify-between text-sm">
            <span>Progression ({{ treatmentPlan.completedSessions }}/{{ treatmentPlan.totalSessions }} séances)</span>
            <span>{{ treatmentPlan.progress }}%</span>
          </div>
          <UProgress :model-value="treatmentPlan.progress" />
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
                <h4 class="mb-2 text-sm font-semibold">Contexte pathologique</h4>
                <p class="text-muted text-sm">{{ treatmentPlan.context }}</p>
              </div>
              <div>
                <h4 class="mb-2 text-sm font-semibold">Niveau de douleur (actuel)</h4>
                <div class="flex items-center gap-3">
                  <USlider :model-value="treatmentPlan.painLevel" :max="10" :min="0" disabled />
                  <span class="font-semibold">{{ treatmentPlan.painLevel }}/10</span>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <h4 class="font-semibold">Fréquence</h4>
                  <p class="text-muted">{{ treatmentPlan.frequency }}</p>
                </div>
                <div>
                  <h4 class="font-semibold">Médecin prescripteur</h4>
                  <p class="text-muted">{{ treatmentPlan.prescribingDoctor }}</p>
                </div>
                <div>
                  <h4 class="font-semibold">Assurance</h4>
                  <p class="text-muted">{{ treatmentPlan.insurance }}</p>
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
              <span class="text-sm">{{ row.getValue('date') }}, {{ row.original.time }}</span>
            </template>
            <template #type-cell="{ row }">
              <span class="text-muted text-sm">{{ row.getValue('type') }}</span>
            </template>
            <template #duration-cell="{ row }">
              <span class="text-muted text-sm">
                {{ row.getValue('duration') }}
              </span>
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
                  v-if="row.getValue('status') === 'upcoming'"
                  icon="i-lucide-x"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                />
                <UButton
                  v-else-if="row.getValue('status') === 'completed'"
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
                  :icon="getDocumentIcon(doc.type)"
                  :color="getDocumentColor(doc.type)"
                  variant="soft"
                  size="lg"
                  square
                />
                <div>
                  <p class="font-semibold">{{ doc.name }}</p>
                  <p class="text-muted text-xs">Téléversé le {{ doc.uploadDate }} par {{ doc.uploadedBy }}</p>
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
    :patient="patient"
    :open="createSlideoverOpen"
    @update:open="createSlideoverOpen = $event"
    @create="handleCreatePlan"
  />
</template>
