<script setup lang="ts">
  const props = defineProps<{
    patient: Patient
    treatmentPlanId?: string
  }>()

  const emit = defineEmits<{ close: [] }>()

  const { treatmentPlans } = usePatientTreatmentPlans(() => props.patient.id)

  const selectedPlanId = ref<string>(props.treatmentPlanId || '')
  const fileInputRef = ref<HTMLInputElement>()

  const { uploadedFiles, documentLoading, handleFileSelect, handleDrop, removeFile, openFileDialog, uploadDocuments } =
    useDocumentUpload({
      patientId: () => props.patient.id,
      organizationId: () => props.patient.organizationId,
      treatmentPlanId: () => selectedPlanId.value,
      fileInputRef,
      onSuccess: () => emit('close')
    })
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
            @drop.prevent="handleDrop"
            @dragover.prevent="true"
            @dragleave.prevent="false"
          >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              class="hidden"
              :accept="ACCEPTED_FILE_TYPES.join(',')"
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
        <UButton variant="outline" color="neutral" size="lg" :disabled="documentLoading" @click="emit('close')">
          Annuler
        </UButton>
        <UButton
          icon="i-hugeicons-upload-01"
          color="primary"
          size="lg"
          :loading="documentLoading"
          :disabled="documentLoading || uploadedFiles.length === 0 || !selectedPlanId"
          @click="uploadDocuments"
        >
          Téléverser {{ uploadedFiles.length }} document(s)
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
