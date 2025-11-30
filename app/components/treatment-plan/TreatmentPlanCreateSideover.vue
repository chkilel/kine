<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import type { FormSubmitEvent } from '@nuxt/ui'

  // Types
  interface UploadedFile {
    file: File
    title: string
    type: DocumentCategory
    stagedAt: Date
  }

  const props = defineProps<{
    patient: Patient
    treatmentPlan?: TreatmentPlan
  }>()
  const emit = defineEmits<{ close: [data?: any] }>()

  // Date formatter
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()

  const { mutate: updateTreatmentPlan, data: updatedPlan } = useMutation({
    mutation: ({ planId, data }: { planId: string; data: TreatmentPlanUpdate }) =>
      requestFetch(`/api/patients/${props.patient.id}/treatment-plans/${planId}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['treatment-plans', props.patient.id] })
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement mis à jour avec succès',
        color: 'success'
      })
    },
    onError: (error: any) => {
      console.error('Error updating treatment plan:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la mise à jour du plan de traitement',
        color: 'error'
      })
    }
  })

  const { mutate: createTreatmentPlan, data: createdPlan } = useMutation({
    mutation: ({ data }: { data: TreatmentPlanUpdate }) =>
      requestFetch(`/api/patients/${props.patient.id}/treatment-plans`, {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['treatment-plans', props.patient.id] })
      toast.add({
        title: 'Succès',
        description: 'Plan de traitement mis à jour avec succès',
        color: 'success'
      })
    },
    onError: (error: any) => {
      console.error('Error updating treatment plan:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la mise à jour du plan de traitement',
        color: 'error'
      })
    }
  })
  const toast = useToast()
  const { uploadFile } = useUploads()

  const { user } = await useAuth()
  const { activeOrganization } = useOrganization()
  if (!user || !activeOrganization.value.data) {
    await navigateTo('/login')
  }

  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()

  const therapists = computed(() => [user.value!])
  const loading = ref(false)
  const isEditMode = computed(() => !!props.treatmentPlan)

  // Helper to convert date strings to Date objects
  const toDate = (date: Date | string | null | undefined): Date | null => {
    if (!date) return null
    return typeof date === 'string' ? new Date(date) : date
  }

  // Initialize form based on mode
  const form = reactive<TreatmentPlanCreate>({
    patientId: props.patient.id!,
    therapistId: props.treatmentPlan?.therapistId || user.value!.id,
    organizationId: activeOrganization.value.data!.id,
    prescribingDoctor: props.treatmentPlan?.prescribingDoctor || '',
    prescriptionDate: toDate(props.treatmentPlan?.prescriptionDate) || new Date(),
    title: props.treatmentPlan?.title || '',
    diagnosis: props.treatmentPlan?.diagnosis || '',
    objective: props.treatmentPlan?.objective || '',
    status: props.treatmentPlan?.status || 'planned',
    startDate: toDate(props.treatmentPlan?.startDate) || new Date(),
    endDate: toDate(props.treatmentPlan?.endDate),
    numberOfSessions: props.treatmentPlan?.numberOfSessions || 0,
    sessionFrequency: props.treatmentPlan?.sessionFrequency || undefined,
    painLevel: props.treatmentPlan?.painLevel || 10,
    coverageStatus: props.treatmentPlan?.coverageStatus || 'not_required',
    insuranceInfo: props.treatmentPlan?.insuranceInfo || '',
    notes: props.treatmentPlan?.notes || null
  })

  // Calendar models for date components
  const prescriptionDateModel = shallowRef<CalendarDate | null>(null)
  const startDateModel = shallowRef<CalendarDate | null>(null)
  const endDateModel = shallowRef<CalendarDate | null>(null)

  // Initialize calendar models from form dates
  onMounted(() => {
    if (form.prescriptionDate && form.prescriptionDate instanceof Date) {
      prescriptionDateModel.value = new CalendarDate(
        form.prescriptionDate.getFullYear(),
        form.prescriptionDate.getMonth() + 1,
        form.prescriptionDate.getDate()
      )
    }
    if (form.startDate && form.startDate instanceof Date) {
      startDateModel.value = new CalendarDate(
        form.startDate.getFullYear(),
        form.startDate.getMonth() + 1,
        form.startDate.getDate()
      )
    }
    if (form.endDate && form.endDate instanceof Date) {
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

  async function handleSubmit(event: FormSubmitEvent<TreatmentPlanCreate>) {
    loading.value = true

    try {
      // First, upload all staged files
      const uploadedDocuments = []
      const failedFiles = []

      for (const uploadedFile of uploadedFiles.value) {
        try {
          // Use composable to upload file
          const fileName = `${Date.now()}-${uploadedFile.file.name}`
          const storageKey = `orgs/docs/${props.patient.id}/${fileName}`
          await uploadFile({
            file: uploadedFile.file,
            folder: `orgs/docs/${props.patient.id}`,
            name: fileName
          })

          // Create document record
          const documentData = {
            fileName,
            originalFileName: uploadedFile.file.name,
            mimeType: uploadedFile.file.type,
            fileSize: uploadedFile.file.size,
            storageKey,
            category: mapDocumentTypeToCategory(uploadedFile.type),
            description: uploadedFile.title
          }

          const document = await $fetch(`/api/patients/${props.patient.id}/documents`, {
            method: 'POST',
            body: documentData
          })

          if (!document) {
            throw new Error('Failed to create document record')
          }

          uploadedDocuments.push(document)
        } catch (error) {
          console.error('Error uploading file:', error)
          failedFiles.push({
            fileName: uploadedFile.file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      if (isEditMode.value) {
        // Update existing treatment plan
        updateTreatmentPlan({
          planId: props.treatmentPlan!.id,
          data: event.data
        })
      } else {
        // Create new treatment plan
        createTreatmentPlan({
          data: event.data
        })
      }

      // Link uploaded documents to the treatment plan
      for (const document of uploadedDocuments) {
        try {
          await $fetch(`/api/patients/${props.patient.id}/documents/${document.id}`, {
            method: 'PUT',
            body: { treatmentPlanId: createdPlan.value?.id || updatedPlan.value?.id }
          })
        } catch (error) {
          console.error('Error linking document to treatment plan:', error)
        }
      }

      await refreshNuxtData(`treatment-plans-${props.patient.id}`)
      emit('close')
      resetForm()
    } catch (error: any) {
      console.error('Error creating/updating treatment plan:', error)
      const action = isEditMode.value ? 'mise à jour' : 'création'
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || `Échec de la ${action} du plan de traitement`,
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

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue
      const uploadedFile: UploadedFile = {
        file,
        title: file.name,
        type: 'prescriptions',
        stagedAt: new Date()
      }
      uploadedFiles.value.push(uploadedFile)
    }
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function handleCancel() {
    emit('close', false)
  }

  const formRef = useTemplateRef<HTMLFormElement>('newPlanRef')
  function submitButton() {
    formRef.value?.submit()
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    :title="isEditMode ? 'Modifier un plan de traitement' : 'Créer un plan de traitement'"
    :description="
      isEditMode
        ? 'Modifiez les informations du plan de traitement.'
        : 'Ajoutez les informations de base du plan de traitement.'
    "
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
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  :items="[...TREATMENT_PLAN_STATUS_OPTIONS]"
                  value-key="value"
                  label-key="label"
                  orientation="horizontal"
                  indicator="hidden"
                  variant="table"
                  size="sm"
                  :ui="{ item: 'p-2 flex-1' }"
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
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField
                label="Niveau de douleur actuel"
                name="painLevel"
                help="Échelle de 0 à 10"
                class="md:col-span-2"
              >
                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span v-for="(item, index) in [...Array(11).keys()]" :key="index">{{ item }}</span>
                  </div>
                  <USlider v-model="form.painLevel" :min="0" :max="10" :step="0.5" class="w-full flex-1" />
                </div>
              </UFormField>
              <UFormField label="Informations assurance / mutuelle" name="insuranceInfo">
                <UInput v-model="form.insuranceInfo" placeholder="Mutuelle SantéPlus..." class="w-full" />
              </UFormField>
              <UFormField label="Statut de couverture">
                <USelectMenu
                  v-model="form.coverageStatus"
                  :items="INSURANCE_COVERAGE_OPTIONS"
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

              <!-- Staged Files -->
              <div v-if="uploadedFiles.length > 0" class="space-y-3">
                <div
                  v-for="(uploadedFile, index) in uploadedFiles"
                  :key="index"
                  class="border-default bg-muted space-y-3 rounded-xl border p-4"
                >
                  <div class="flex w-full items-start gap-10">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">
                        {{ uploadedFile.file.name }}
                      </p>
                      <p class="text-muted mt-1 text-xs">
                        Prêt pour le téléversement • {{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) }} MB
                      </p>
                    </div>

                    <UButton
                      icon="i-lucide-trash"
                      variant="ghost"
                      color="error"
                      size="sm"
                      square
                      @click="removeFile(index)"
                    />
                  </div>

                  <div class="border-default bg-default rounded-lg border p-3">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <UFormField label="Titre descriptif du document" size="xs" class="sm:col-span-2">
                        <UInput v-model="uploadedFile.title" placeholder="Titre descriptif" size="sm" class="w-full" />
                      </UFormField>
                      <UFormField label="Type de document" size="xs">
                        <USelectMenu
                          v-model="uploadedFile.type"
                          value-key="value"
                          size="sm"
                          :items="DOCUMENT_CATEGORY_OPTIONS"
                          class="w-full"
                        />
                      </UFormField>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Existing Documents -->
              <div class="space-y-3 pt-4">
                <div class="border-default flex items-center gap-4 rounded-lg border p-3">
                  <UIcon name="i-lucide-image" class="text-primary text-3xl" />
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
          {{ isEditMode ? 'Mettre à jour' : 'Enregistrer' }} le plan
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
