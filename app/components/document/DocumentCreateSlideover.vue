<script setup lang="ts">
  interface UploadedFile {
    file: File
    title: string
    category: DocumentCategory
    description: string
  }

  const props = defineProps<{
    patient: Patient
    treatmentPlanId?: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  const toast = useToast()
  const queryCache = useQueryCache()
  const { uploadFile } = useUploads()

  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patient.id)

  const uploadedFiles = ref<UploadedFile[]>([])
  const selectedPlanId = ref<string>(props.treatmentPlanId || '')
  const uploadLoading = ref(false)
  const fileInputRef = ref<HTMLInputElement>()
  const dragOver = ref(false)

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    addFiles(files)
  }

  function handleDrop(event: DragEvent) {
    dragOver.value = false
    if (event.dataTransfer?.files) {
      addFiles(Array.from(event.dataTransfer.files))
    }
  }

  function addFiles(files: File[]) {
    const invalidFiles = files.filter(
      (file) => file.size > MAX_FILE_SIZE || !file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i)
    )

    if (invalidFiles.length > 0) {
      toast.add({
        title: 'Fichiers non valides',
        description: `Certains fichiers dépassent 4MB ou ne sont pas dans un format accepté (PDF, JPG, PNG, DOC, DOCX).`,
        color: 'error'
      })
    }

    const validFiles = files.filter(
      (file) => file.size <= MAX_FILE_SIZE && file.name.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i)
    )

    const newFiles = validFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      category: 'other' as DocumentCategory,
      description: ''
    }))

    uploadedFiles.value.push(...newFiles)
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function openFileDialog() {
    fileInputRef.value?.click()
  }

  async function uploadDocuments() {
    if (!selectedPlanId.value) {
      toast.add({
        title: 'Plan de traitement requis',
        description: 'Veuillez sélectionner un plan de traitement pour ajouter des documents.',
        color: 'error'
      })
      return
    }

    if (uploadedFiles.value.length === 0) return

    const patientId = props.patient.id
    const organizationId = props.patient.organizationId

    if (!patientId || !organizationId) {
      toast.add({
        title: 'Erreur',
        description: 'Informations patient manquantes',
        color: 'error'
      })
      return
    }

    uploadLoading.value = true
    const uploadedDocuments = []

    try {
      for (const uploadedFile of uploadedFiles.value) {
        try {
          const uploadResult = await uploadFile({
            file: uploadedFile.file,
            folder: `orgs/${organizationId}/docs/${patientId}`,
            name: uploadedFile.file.name
          })

          const documentData = {
            organizationId,
            treatmentPlanId: selectedPlanId.value,
            fileName: uploadedFile.file.name,
            originalFileName: uploadedFile.file.name,
            mimeType: uploadedFile.file.type,
            fileSize: uploadedFile.file.size,
            storageKey: uploadResult.key,
            category: uploadedFile.category,
            description: uploadedFile.title
          }

          const document = await $fetch(`/api/patients/${patientId}/documents`, {
            method: 'POST',
            body: documentData
          })

          if (document) {
            uploadedDocuments.push(document)
          }
        } catch (error) {
          console.error('Error uploading file:', uploadedFile.file.name, error)
          toast.add({
            title: 'Erreur',
            description: `Échec du téléversement de ${uploadedFile.file.name}`,
            color: 'error'
          })
        }
      }

      if (uploadedDocuments.length > 0) {
        uploadedFiles.value = []
        queryCache.invalidateQueries({ key: ['documents', patientId] })

        toast.add({
          title: 'Succès',
          description: `${uploadedDocuments.length} document(s) téléversé(s) avec succès`,
          color: 'success'
        })
        emit('close')
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec du téléversement des documents',
        color: 'error'
      })
    } finally {
      uploadLoading.value = false
    }
  }
</script>

<template>
  <USlideover
    :dismissible="false"
    title="Ajouter des documents"
    description="Téléversez des documents pour ce patient. Tous les documents doivent être associés à un plan de traitement."
    :ui="{ content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated' }"
  >
    <template #body>
      <div class="space-y-6">
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Plan de traitement</h3>
          <UFormField label="Sélectionner un plan" required>
            <PatientTreatmentPlanTabPlanSelector
              v-model:selected-plan-id="selectedPlanId"
              :treatment-plans="(treatmentPlans || []) as readonly TreatmentPlanWithProgress[]"
              placeholder="Sélectionner un plan de traitement"
              hint="Tous les documents doivent être associés à un plan de traitement."
            />
          </UFormField>
        </UCard>

        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Documents à téléverser</h3>

          <div
            class="border-default bg-muted/30 mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors"
            :class="{ 'border-primary bg-primary/5': dragOver }"
            @drop.prevent="handleDrop"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
          >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              class="hidden"
              :accept="ACCEPTED_FILE_TYPES"
              @change="handleFileSelect"
            />
            <UIcon name="i-hugeicons-upload-04" class="text-muted mb-3 size-12" />
            <p class="text-muted mb-2">Glissez-déposez vos fichiers ici</p>
            <p class="text-muted mb-4 text-sm">ou</p>
            <UButton icon="i-hugeicons-folder-open" color="primary" variant="soft" @click="openFileDialog">
              Parcourir les fichiers
            </UButton>
            <p class="text-muted mt-4 text-xs">Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 4MB par fichier)</p>
          </div>

          <div v-if="uploadedFiles.length > 0" class="space-y-3">
            <div
              v-for="(uploadedFile, index) in uploadedFiles"
              :key="index"
              class="border-default bg-muted space-y-3 rounded-lg border p-4"
            >
              <div class="flex w-full items-start gap-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ uploadedFile.file.name }}</p>
                  <p class="text-muted mt-1 text-xs">
                    Prêt pour le téléversement • {{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) }} MB
                  </p>
                </div>
                <UButton
                  icon="i-hugeicons-delete-02"
                  variant="ghost"
                  color="error"
                  size="sm"
                  square
                  @click="removeFile(index)"
                />
              </div>

              <div class="grid gap-4">
                <UFormField label="Titre du document" size="sm">
                  <UInput
                    v-model="uploadedFile.title"
                    variant="outline"
                    placeholder="Titre descriptif"
                    size="sm"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Type de document" size="sm">
                  <USelect
                    v-model="uploadedFile.category"
                    value-key="value"
                    variant="outline"
                    size="sm"
                    :items="DOCUMENT_CATEGORY_OPTIONS"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton variant="outline" color="neutral" size="lg" :disabled="uploadLoading" @click="emit('close')">
          Annuler
        </UButton>
        <UButton
          icon="i-hugeicons-upload-01"
          color="primary"
          size="lg"
          :loading="uploadLoading"
          :disabled="uploadLoading || uploadedFiles.length === 0 || !selectedPlanId"
          @click="uploadDocuments"
        >
          Téléverser {{ uploadedFiles.length }} document(s)
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
