<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  // Constants
  const statusOptions = [
    { value: 'planned', label: 'Planifié' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
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

  // Types
  interface UploadedFile {
    file: File
    title: string
    type: string
    status: 'uploading' | 'uploaded' | 'error'
    progress: number
    documentId?: string
  }

  const props = defineProps<{
    patient: Patient
    open: boolean
  }>()

  const emit = defineEmits<{
    'update:open': [value: boolean]
    created: [plan: TreatmentPlan]
  }>()

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  const session = await authClient.useSession(useFetch)
  if (!session.data.value?.user) {
    await navigateTo('/login')
  }

  const currentUser = computed(() => session.data.value?.user)
  const therapists = computed(() => [session.data.value?.user!])

  const toast = useToast()
  const loading = ref(false)

  const form = reactive<TreatmentPlanCreate>({
    patientId: props.patient.id!,
    therapistId: currentUser.value!.id,
    prescribingDoctor: '',
    prescriptionDate: new Date(),
    title: '',
    diagnosis: '',
    objective: '',
    status: 'planned',
    startDate: new Date(),
    endDate: null,
    numberOfSessions: 0,
    sessionFrequency: undefined,
    painLevel: 10,
    coverageStatus: 'not_required',
    insuranceInfo: '',
    notes: undefined
  })

  // Calendar models for date components
  const prescriptionDateModel = shallowRef<CalendarDate | null>(null)
  const startDateModel = shallowRef<CalendarDate | null>(null)
  const endDateModel = shallowRef<CalendarDate | null>(null)

  // Initialize calendar models from form dates
  onMounted(() => {
    if (form.prescriptionDate) {
      prescriptionDateModel.value = new CalendarDate(
        form.prescriptionDate.getFullYear(),
        form.prescriptionDate.getMonth() + 1,
        form.prescriptionDate.getDate()
      )
    }
    if (form.startDate) {
      startDateModel.value = new CalendarDate(
        form.startDate.getFullYear(),
        form.startDate.getMonth() + 1,
        form.startDate.getDate()
      )
    }
    if (form.endDate) {
      endDateModel.value = new CalendarDate(
        form.endDate.getFullYear(),
        form.endDate.getMonth() + 1,
        form.endDate.getDate()
      )
    }
  })

  // Watch calendar models and update form state
  watch(prescriptionDateModel, (val) => {
    form.prescriptionDate = val ? val.toDate(getLocalTimeZone()) : new Date()
  })

  watch(startDateModel, (val) => {
    form.startDate = val ? val.toDate(getLocalTimeZone()) : new Date()
  })

  watch(endDateModel, (val) => {
    form.endDate = val ? val.toDate(getLocalTimeZone()) : null
  })

  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()

  async function handleSubmit(event: FormSubmitEvent<TreatmentPlanCreate>) {
    loading.value = true

    try {
      // Create treatment plan data matching the API schema
      const planData = {
        patientId: props.patient.id,
        title: event.data.title,
        diagnosis: event.data.diagnosis,
        objective: event.data.objective,
        startDate: event.data.startDate || new Date(),
        endDate: event.data.endDate || null,
        numberOfSessions: event.data.numberOfSessions,
        sessionFrequency: event.data.sessionFrequency,
        status: event.data.status,
        prescribingDoctor: event.data.prescribingDoctor,
        therapistId: event.data.therapistId,
        prescriptionDate: event.data.prescriptionDate || null,
        painLevel: event.data.painLevel,
        coverageStatus: event.data.coverageStatus,
        insuranceInfo: event.data.insuranceInfo,
        notes: '' // FIXME
      }

      const treatmentPlan = await $fetch<TreatmentPlan>(`/api/patients/${props.patient.id}/treatment-plans`, {
        method: 'POST',
        body: planData
      })

      if (!treatmentPlan) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create treatment plan'
        })
      }

      // Upload documents and link them to the treatment plan
      for (const uploadedFile of uploadedFiles.value) {
        if (uploadedFile.status === 'uploaded' && !uploadedFile.documentId) {
          try {
            const documentData = {
              fileName: `${Date.now()}-${uploadedFile.file.name}`,
              originalFileName: uploadedFile.file.name,
              mimeType: uploadedFile.file.type,
              fileSize: uploadedFile.file.size,
              storageKey: `orgs/docs/${props.patient.id}/${Date.now()}-${uploadedFile.file.name}`,
              category: mapDocumentTypeToCategory(uploadedFile.type),
              description: uploadedFile.title,
              treatmentPlanId: treatmentPlan.id
            }

            const document = await $fetch(`/api/patients/${props.patient.id}/documents`, {
              method: 'POST',
              body: documentData
            })

            if (!document) {
              throw createError({
                statusCode: 500,
                statusMessage: 'Failed to attach document to the treatement plan'
              })
            }
            uploadedFile.documentId = document.id
          } catch (error) {
            console.error('Error creating document record:', error)
          }
        }
      }

      toast.add({
        title: 'Succès',
        description: 'Plan de traitement créé avec succès',
        color: 'success'
      })

      emit('created', treatmentPlan)
      emit('update:open', false)
      resetForm()
    } catch (error: any) {
      console.error('Error creating treatment plan:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la création du plan de traitement',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    Object.assign(form, {
      patientId: '',
      prescribingDoctor: '',
      prescriptionDate: new Date(),
      title: '',
      diagnosis: '',
      objective: '',
      therapistId: '',
      status: 'planned',
      startDate: new Date(),
      endDate: undefined,
      numberOfSessions: 4,
      sessionFrequency: undefined,
      painLevel: 4,
      coverageStatus: 'not_required',
      insuranceInfo: '',
      notes: undefined
    })

    // Reset calendar models
    prescriptionDateModel.value = null
    startDateModel.value = null
    endDateModel.value = null

    uploadedFiles.value = []
  }

  function mapDocumentTypeToCategory(type: string): string {
    const categoryMap: Record<string, string> = {
      Radiologie: 'imaging',
      Analyse: 'lab_results',
      Prescription: 'prescriptions',
      'Rapport médical': 'treatment_notes',
      Autre: 'other'
    }
    return categoryMap[type] || 'other'
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue
      const uploadedFile: UploadedFile = {
        file,
        title: file.name,
        type: 'Prescription',
        status: 'uploading',
        progress: 0
      }
      uploadedFiles.value.push(uploadedFile)

      await uploadFile(uploadedFile)
    }
  }

  async function uploadFile(uploadedFile: UploadedFile) {
    try {
      // Get signed URL for upload
      const storageKey = `orgs/docs/${props.patient.id}/${Date.now()}-${uploadedFile.file.name}`
      const { url } = await $fetch('/api/r2/upload', {
        method: 'POST',
        body: {
          key: storageKey,
          contentType: uploadedFile.file.type
        }
      })

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        if (uploadedFile.progress < 90) {
          uploadedFile.progress += Math.random() * 20
          if (uploadedFile.progress > 90) uploadedFile.progress = 90
        }
      }, 200)

      // Upload file to R2 using fetch (simpler and more reliable)
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': uploadedFile.file.type },
        body: uploadedFile.file
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      uploadedFile.status = 'uploaded'
      uploadedFile.progress = 100
    } catch (error) {
      console.error('Upload error:', error)
      uploadedFile.status = 'error'
      toast.add({
        title: 'Erreur',
        description: `Échec du téléversement de ${uploadedFile.file.name}`,
        color: 'error'
      })
    }
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function handleCancel() {
    emit('update:open', false)
  }

  const formRef = useTemplateRef<HTMLFormElement>('newPlanRef')
  function submitButton() {
    formRef.value?.submit()
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
      <UForm
        ref="newPlanRef"
        :schema="treatmentPlanCreateSchema"
        :state="form"
        class="space-y-6"
        @submit="handleSubmit"
      >
        <div class="space-y-6">
          <!-- Patient Information -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Informations patient</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Nom du patient">
                <UInput :model-value="`${patient.firstName} ${patient.lastName}`" disabled class="w-full" />
              </UFormField>
              <UFormField label="Date de naissance">
                <UInput :model-value="patient.dateOfBirth?.toLocaleDateString()" disabled class="w-full" />
              </UFormField>
              <UFormField label="Médecin prescripteur" name="prescribingDoctor" required>
                <UInput v-model="form.prescribingDoctor" placeholder="Dr. Leblanc" class="w-full" />
              </UFormField>
              <UFormField label="Date de prescription" name="prescriptionDate" required>
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                    {{
                      prescriptionDateModel
                        ? df.format(prescriptionDateModel.toDate(getLocalTimeZone()))
                        : 'Sélectionner une date'
                    }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="prescriptionDateModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </UCard>

          <!-- Treatment Plan Details -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Détails du plan de traitement</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Titre" name="title" required class="md:col-span-2">
                <UInput v-model="form.title" placeholder="Ex: Rééducation épaule droite" class="w-full" />
              </UFormField>
              <UFormField label="Pathologie / Diagnostic" name="diagnosis" required class="md:col-span-2">
                <UTextarea
                  v-model="form.diagnosis"
                  placeholder="Tendinopathie du supra-épineux..."
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Objectifs thérapeutiques" name="objective" required class="md:col-span-2">
                <UTextarea
                  v-model="form.objective"
                  placeholder="Améliorer l'amplitude, réduire la douleur..."
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Kinésithérapeute responsable" name="therapistId" required>
                <USelectMenu
                  v-model="form.therapistId"
                  value-key="id"
                  label-key="name"
                  :items="therapists"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Statut" name="status">
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
              <UFormField label="Nombre de séances" name="numberOfSessions">
                <UInputNumber v-model="form.numberOfSessions" :min="1" :max="50" class="w-full" />
              </UFormField>
              <UFormField label="Date de début" name="startDate">
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                    {{
                      startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : 'Sélectionner une date'
                    }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="startDateModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </UCard>

          <!-- Medical Data and Insurance -->
          <UCard variant="outline">
            <h3 class="text-highlighted mb-4 text-base font-bold">Données médicales et assurance</h3>
            <div class="grid grid-cols-1 gap-6">
              <UFormField label="Niveau de douleur actuel" name="painLevel" help="Échelle de 0 à 10">
                <div class="flex items-center gap-4">
                  <USlider v-model="form.painLevel" :min="0" :max="10" class="w-full flex-1" />
                  <UInput v-model="form.painLevel" type="number" :min="0" :max="10" class="w-20 text-center" />
                </div>
              </UFormField>
              <UFormField label="Informations assurance / mutuelle" name="insuranceInfo">
                <UInput v-model="form.insuranceInfo" placeholder="Mutuelle SantéPlus..." class="w-full" />
              </UFormField>
              <UFormField label="Statut de couverture">
                <USelectMenu
                  v-model="form.coverageStatus"
                  :items="coverageOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Selectionner ..."
                  class="w-full"
                />
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
                  @click="fileInputRef?.click()"
                >
                  <UIcon name="i-lucide-upload" class="text-muted mb-2 text-4xl" />
                  <p class="text-muted text-sm">
                    Glissez-déposez un fichier ou
                    <span class="text-primary font-semibold">cliquez pour téléverser</span>
                    .
                  </p>
                  <input
                    ref="fileInputRef"
                    type="file"
                    multiple
                    class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    @change="handleFileSelect"
                  />
                </div>
              </div>

              <!-- Uploaded Files -->
              <div v-if="uploadedFiles.length > 0" class="space-y-3">
                <div
                  v-for="(uploadedFile, index) in uploadedFiles"
                  :key="index"
                  class="border-default bg-muted space-y-3 rounded-xl border p-4"
                >
                  <div class="flex items-center gap-3">
                    <div class="grow">
                      <p class="text-default text-sm font-medium">{{ uploadedFile.file.name }}</p>
                      <div class="bg-muted mt-1 h-1.5 w-full rounded-full">
                        <div
                          class="bg-primary h-1.5 rounded-full transition-all duration-300"
                          :style="{ width: `${uploadedFile.progress}%` }"
                        ></div>
                      </div>
                      <p class="text-muted mt-1 text-xs">
                        {{
                          uploadedFile.status === 'uploading'
                            ? `Téléversement en cours... ${uploadedFile.progress}%`
                            : uploadedFile.status === 'uploaded'
                              ? 'Téléversé avec succès'
                              : 'Erreur de téléversement'
                        }}
                      </p>
                    </div>
                    <UIcon
                      :name="
                        uploadedFile.status === 'uploading'
                          ? 'i-lucide-loader-2'
                          : uploadedFile.status === 'uploaded'
                            ? 'i-lucide-check-circle'
                            : 'i-lucide-x-circle'
                      "
                      :class="[
                        'animate-spin text-xl',
                        uploadedFile.status === 'uploaded'
                          ? 'text-green-500'
                          : uploadedFile.status === 'error'
                            ? 'text-red-500'
                            : 'text-blue-500'
                      ]"
                    />
                    <UButton
                      v-if="uploadedFile.status !== 'uploading'"
                      icon="i-lucide-trash"
                      variant="ghost"
                      color="error"
                      size="sm"
                      square
                      @click="removeFile(index)"
                    />
                  </div>

                  <div
                    v-if="uploadedFile.status === 'uploaded'"
                    class="border-default bg-elevated rounded-lg border p-3"
                  >
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div class="sm:col-span-2">
                        <UFormField label="Titre descriptif du document" size="xs">
                          <UInput
                            v-model="uploadedFile.title"
                            placeholder="Titre descriptif"
                            size="sm"
                            class="w-full"
                          />
                        </UFormField>
                      </div>
                      <div>
                        <UFormField label="Type de document" size="xs">
                          <USelectMenu
                            v-model="uploadedFile.type"
                            size="sm"
                            :options="[
                              { label: 'Radiologie', value: 'Radiologie' },
                              { label: 'Analyse', value: 'Analyse' },
                              { label: 'Prescription', value: 'Prescription' },
                              { label: 'Rapport médical', value: 'Rapport médical' },
                              { label: 'Autre', value: 'Autre' }
                            ]"
                            class="w-full"
                          />
                        </UFormField>
                      </div>
                      <div class="text-muted text-xs sm:self-end">
                        <p>Taille: {{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) }} MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Existing Documents -->
              <div class="space-y-3 pt-4">
                <div class="border-default flex items-center gap-4 rounded-lg border p-3">
                  <UIcon name="i-lucide-image" class="text-3xl text-blue-500" />
                  <div class="grow">
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
                  <div class="grow">
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
                {{ `${patient.firstName} ${patient.lastName}` }}
              </p>
              <p>
                <strong>Plan :</strong>
                {{ form.title || 'Non défini' }}
              </p>
              <p>
                <strong>Kinésithérapeute :</strong>
                {{ form.therapistId || 'Non défini' }}
              </p>
              <p>
                <strong>Période :</strong>
                À partir du
                {{ startDateModel ? df.format(startDateModel.toDate(getLocalTimeZone())) : '[Date de début]' }}
              </p>
            </div>
          </UCard>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="handleCancel">
          Annuler
        </UButton>
        <UButton
          type="submit"
          @click="submitButton"
          color="primary"
          class="h-9 px-3 text-sm font-semibold"
          :loading="loading"
          :disabled="loading"
        >
          Enregistrer le plan
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
