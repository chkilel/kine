<script setup lang="ts">
  import type { fieldGroup } from '#build/ui'
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  interface Patient {
    id: string
    name: string
    birthDate: string
  }

  interface TreatmentPlanForm {
    prescribingDoctor: string
    prescriptionDate: any
    title: string
    diagnosis: string
    objectives: string
    therapist: string
    status: 'active' | 'pending' | 'completed'
    startDate: any
    endDate: any
    painLevel: number
    coverageStatus: { value: string; label: string } | undefined
    insuranceInfo: string
  }

  const props = defineProps<{
    patient: Patient
    open: boolean
  }>()

  const emit = defineEmits<{
    'update:open': [value: boolean]
    create: [plan: TreatmentPlanForm]
  }>()

  const form = reactive<TreatmentPlanForm>({
    prescribingDoctor: '',
    prescriptionDate: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
    title: '',
    diagnosis: '',
    objectives: '',
    therapist: '',
    status: 'active',
    startDate: null,
    endDate: null,
    painLevel: 4,
    coverageStatus: { value: 'covered', label: 'Prise en charge acceptée' },
    insuranceInfo: ''
  })

  const therapists = ['Dr. Martin', 'Dr. Durand', 'Dr. Bernard', 'Dr. Petit']

  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'pending', label: 'En attente' },
    { value: 'completed', label: 'Terminé' }
  ]

  const coverageOptions = [
    { value: 'not_required', label: 'Non nécessaire' }, // Patient sans mutuelle ou paie directement
    { value: 'not_provided', label: 'Informations manquantes' }, // Attente des infos de mutuelle / Sécurité Sociale
    { value: 'to_verify', label: 'À vérifier' }, // Infos reçues mais pas encore validées
    { value: 'awaiting_agreement', label: "En attente d'accord" }, // Attente d'accord préalable de l'organisme
    { value: 'covered', label: 'Prise en charge acceptée' }, // Accord total obtenu
    { value: 'partially_covered', label: 'Prise en charge partielle' }, // Une partie reste à la charge du patient
    { value: 'refused', label: 'Prise en charge refusée' }, // Accord refusé par l'organisme
    { value: 'expired', label: 'Prise en charge expirée' }, // Accord dépassé ou non renouvelé
    { value: 'cancelled', label: 'Prise en charge annulée' } // Annulée à la demande du patient ou de l'assureur
  ]

  const df = new DateFormatter('fr-FR', {
    dateStyle: 'medium'
  })

  function handleSubmit() {
    const planData: TreatmentPlanForm = {
      prescribingDoctor: form.prescribingDoctor,
      prescriptionDate: form.prescriptionDate,
      title: form.title,
      diagnosis: form.diagnosis,
      objectives: form.objectives,
      therapist: form.therapist,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      painLevel: form.painLevel,
      coverageStatus: form.coverageStatus,
      insuranceInfo: form.insuranceInfo
    }
    emit('create', planData)
    emit('update:open', false)
    // Reset form
    Object.assign(form, {
      prescribingDoctor: '',
      prescriptionDate: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
      title: '',
      diagnosis: '',
      objectives: '',
      therapist: '',
      status: 'active',
      startDate: null,
      endDate: null,
      painLevel: 4,
      coverageStatus: { value: 'covered', label: 'Prise en charge acceptée' },
      insuranceInfo: ''
    })
  }

  function handleCancel() {
    emit('update:open', false)
  }
</script>

<template>
  <USlideover
    :open="open"
    :dismissible="false"
    @update:open="emit('update:open', $event)"
    title="Créer un plan de traitement"
    description="Ajoutez les informations de base du plan de traitement."
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated'
    }"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Patient Information -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations patient</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Nom du patient">
              <UInput :model-value="patient.name" disabled class="w-full" />
            </UFormField>
            <UFormField label="Date de naissance">
              <UInput :model-value="patient.birthDate" disabled class="w-full" />
            </UFormField>
            <UFormField label="Médecin prescripteur" required>
              <UInput v-model="form.prescribingDoctor" placeholder="Dr. Leblanc" class="w-full" />
            </UFormField>
            <UFormField label="Date de prescription" required>
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                  {{
                    form.prescriptionDate
                      ? df.format(form.prescriptionDate.toDate(getLocalTimeZone()))
                      : 'Sélectionner une date'
                  }}
                </UButton>
                <template #content>
                  <UCalendar v-model="form.prescriptionDate as any" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
          </div>
        </UCard>

        <!-- Treatment Plan Details -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Détails du plan de traitement</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Titre" required class="md:col-span-2">
              <UInput v-model="form.title" placeholder="Ex: Rééducation épaule droite" class="w-full" />
            </UFormField>
            <UFormField label="Pathologie / Diagnostic" required class="md:col-span-2">
              <UTextarea
                v-model="form.diagnosis"
                placeholder="Tendinopathie du supra-épineux..."
                :rows="3"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Objectifs thérapeutiques" required class="md:col-span-2">
              <UTextarea
                v-model="form.objectives"
                placeholder="Améliorer l'amplitude, réduire la douleur..."
                :rows="3"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Kinésithérapeute responsable" required>
              <USelectMenu v-model="form.therapist" :options="therapists" class="w-full" />
            </UFormField>
            <UFormField label="Statut">
              <URadioGroup
                v-model="form.status"
                :items="statusOptions"
                value-key="value"
                label-key="label"
                orientation="horizontal"
                indicator="start"
                variant="table"
                size="sm"
                :ui="{ item: 'p-2' }"
              />
            </UFormField>
            <UFormField label="Nombre de séances">
              <UInputNumber :value="4" class="w-full" />
            </UFormField>
            <UFormField label="Date de début">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                  {{ form.startDate ? df.format(form.startDate.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                </UButton>
                <template #content>
                  <UCalendar v-model="form.startDate as any" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
          </div>
        </UCard>

        <!-- Medical Data and Insurance -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Données médicales et assurance</h3>
          <div class="grid grid-cols-1 gap-6">
            <UFormField label="Niveau de douleur actuel" help="Échelle de 0 à 10">
              <div class="flex items-center gap-4">
                <USlider v-model="form.painLevel" :min="0" :max="10" class="w-full flex-1" />
                <UInput v-model="form.painLevel" type="number" :min="0" :max="10" class="w-20 text-center" />
              </div>
            </UFormField>
            <UFormField label="Informations assurance / mutuelle">
              <UInput v-model="form.insuranceInfo" placeholder="Mutuelle SantéPlus..." class="w-full" />
            </UFormField>
            <UFormField label="Statut de couverture">
              <USelectMenu
                v-model="form.coverageStatus"
                :items="coverageOptions"
                placeholder="Selectionner ..."
                class="w-full"
              />
              <!-- <USelect v-model="form.coverageStatus" :items="coverageOptions" class="w-full" /> -->
            </UFormField>
          </div>
        </UCard>

        <!-- Documents -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Documents liés</h3>
          <div class="space-y-4">
            <!-- Upload Section -->
            <div>
              <h4 class="text-default mb-2 text-sm font-semibold">Téléverser de nouveaux documents</h4>
              <div
                class="border-default hover:bg-muted cursor-pointer rounded-xl border-2 border-dashed p-6 text-center"
              >
                <UIcon name="i-lucide-upload" class="text-muted mb-2 text-4xl" />
                <p class="text-muted text-sm">
                  Glissez-déposez un fichier ou
                  <span class="text-primary font-semibold">cliquez pour téléverser</span>
                  .
                </p>
              </div>
            </div>

            <!-- New Document Form -->
            <div class="border-default bg-muted space-y-3 rounded-xl border p-4">
              <div class="flex items-center gap-3">
                <div class="flex-grow">
                  <p class="text-default text-sm font-medium">Scan_Prescription_Dr-Leblanc.jpg</p>
                  <div class="bg-muted mt-1 h-1.5 w-full rounded-full">
                    <div class="bg-primary h-1.5 rounded-full" style="width: 100%"></div>
                  </div>
                </div>
                <UIcon name="i-lucide-check-circle" class="text-xl text-green-500" />
              </div>

              <div class="border-default bg-elevated rounded-lg border p-3">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <UFormField label="Titre descriptif du document" size="xs">
                      <UInput
                        id="doc-title-new"
                        placeholder="Titre descriptif"
                        size="sm"
                        value="Scan_Prescription_Dr-Leblanc.jpg"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                  <div>
                    <UFormField label="Type de document" size="xs">
                      <USelectMenu
                        id="doc-type-new"
                        size="sm"
                        :options="[
                          { label: 'Radiologie', value: 'Radiologie' },
                          { label: 'Analyse', value: 'Analyse' },
                          { label: 'Prescription', value: 'Prescription' },
                          { label: 'Rapport médical', value: 'Rapport médical' },
                          { label: 'Autre', value: 'Autre' }
                        ]"
                        default-value="Prescription"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                  <div class="text-muted text-xs sm:self-end">
                    <p>Téléversé le 26/09/2024 par Dr. Martin</p>
                  </div>
                </div>
                <div class="mt-4 flex justify-end gap-2">
                  <UButton variant="outline" color="neutral" size="sm" class="h-8 px-3">Annuler</UButton>
                  <UButton color="primary" size="sm" class="h-8 px-3">Confirmer</UButton>
                </div>
              </div>
            </div>

            <!-- Existing Documents -->
            <div class="space-y-3 pt-4">
              <div class="border-default flex items-center gap-4 rounded-lg border p-3">
                <UIcon name="i-lucide-image" class="text-3xl text-blue-500" />
                <div class="flex-grow">
                  <p class="text-default font-semibold">Imagerie de la colonne</p>
                  <div class="text-muted mt-1 flex items-center gap-x-2 text-xs">
                    <span>Radiologie</span>
                    <span class="text-muted">•</span>
                    <span>Radio_Epaule.pdf</span>
                    <span class="text-muted">•</span>
                    <span>25/09/2024</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="sm" square />
                  <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" square />
                  <UButton icon="i-lucide-trash" variant="ghost" color="error" size="sm" square />
                </div>
              </div>

              <div class="border-default flex items-center gap-4 rounded-lg border p-3">
                <UIcon name="i-lucide-file-text" class="text-3xl text-purple-500" />
                <div class="flex-grow">
                  <p class="text-default font-semibold">Analyse sanguine</p>
                  <div class="text-muted mt-1 flex items-center gap-x-2 text-xs">
                    <span>Analyse</span>
                    <span class="text-muted">•</span>
                    <span>analyse_sanguine.pdf</span>
                    <span class="text-muted">•</span>
                    <span>24/09/2024</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="sm" square />
                  <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" square />
                  <UButton icon="i-lucide-trash" variant="ghost" color="error" size="sm" square />
                </div>
              </div>
            </div>

            <!-- Add Document Button -->
            <UButton
              icon="i-lucide-plus"
              variant="outline"
              color="neutral"
              size="sm"
              class="flex h-9 items-center justify-center gap-2 px-3 text-sm font-semibold"
            >
              Joindre un document
            </UButton>
          </div>
        </UCard>

        <!-- Summary -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Résumé avant validation</h3>
          <div class="text-muted space-y-3 text-sm">
            <p>
              <strong>Patient :</strong>
              {{ patient.name }}
            </p>
            <p>
              <strong>Plan :</strong>
              {{ form.title || 'Non défini' }}
            </p>
            <p>
              <strong>Kinésithérapeute :</strong>
              {{ form.therapist || 'Non défini' }}
            </p>
            <p>
              <strong>Période :</strong>
              À partir du
              {{ form.startDate ? df.format(form.startDate.toDate(getLocalTimeZone())) : '[Date de début]' }}
            </p>
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="handleCancel">
          Annuler
        </UButton>
        <UButton color="primary" class="h-9 px-3 text-sm font-semibold" @click="handleSubmit">
          Enregistrer le plan
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
