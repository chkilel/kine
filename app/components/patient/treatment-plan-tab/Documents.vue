<script setup lang="ts">
  interface UploadedFile {
    file: File
    title: string
    type: DocumentCategory
    stagedAt: Date
  }

  const props = defineProps<{ treatmentPlan: TreatmentPlan }>()

  const toast = useToast()
  const queryCache = useQueryCache()

  const { uploadFile } = useUploads()
  const { data: documents } = useDocumentsList(
    () => props.treatmentPlan.patientId,
    () => props.treatmentPlan.id
  )

  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()
  const documentLoading = ref(false)

  // Computed properties
  const hasDocuments = computed(() => !!(documents.value?.length || uploadedFiles.value.length))

  // File management
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files || [])

    const newFiles = files.map((file) => ({
      file,
      title: file.name,
      type: 'other' as DocumentCategory,
      stagedAt: new Date()
    }))

    uploadedFiles.value.push(...newFiles)
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function openFileDialog() {
    fileInputRef.value?.click()
  }

  // Upload documents
  async function uploadDocuments() {
    if (uploadedFiles.value.length === 0) return

    const { id: planId, patientId, organizationId } = props.treatmentPlan

    if (!planId) {
      toast.add({
        title: 'Erreur',
        description: 'Aucun plan de traitement actif',
        color: 'error'
      })
      return
    }

    documentLoading.value = true
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
            treatmentPlanId: planId,
            fileName: uploadedFile.file.name,
            originalFileName: uploadedFile.file.name,
            mimeType: uploadedFile.file.type,
            fileSize: uploadedFile.file.size,
            storageKey: uploadResult.key,
            category: uploadedFile.type,
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
        await refreshNuxtData()
        queryCache.invalidateQueries({
          key: ['documents', props.treatmentPlan.patientId]
        })

        toast.add({
          title: 'Succès',
          description: `${uploadedDocuments.length} document(s) téléversé(s) avec succès`,
          color: 'success'
        })
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error)
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec du téléversement des documents',
        color: 'error'
      })
    } finally {
      documentLoading.value = false
    }
  }
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <UCollapsible :default-open="true">
      <UButton
        color="primary"
        variant="ghost"
        class="group p-4 sm:px-6 sm:py-4"
        :ui="{
          base: 'hover:rounded-b-none',
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
        }"
        trailing-icon="i-lucide-chevron-down"
        block
      >
        <h3 class="text-default text-base font-bold">Documents du plan</h3>
      </UButton>

      <template #content>
        <div class="border-default space-y-5 border-t p-4 sm:p-6">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            @change="handleFileSelect"
          />

          <div class="space-y-4">
            <!-- Staged Files -->
            <div v-if="uploadedFiles.length > 0" class="space-y-3">
              <div
                v-for="(uploadedFile, index) in uploadedFiles"
                :key="index"
                class="border-default bg-muted space-y-3 rounded-lg border p-2"
              >
                <div class="flex w-full items-start gap-10">
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
                  <UFormField label="Titre descriptif du document" size="xs">
                    <UInput
                      v-model="uploadedFile.title"
                      variant="outline"
                      placeholder="Titre descriptif"
                      size="sm"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Type de document" size="xs">
                    <USelect
                      v-model="uploadedFile.type"
                      value-key="value"
                      variant="outline"
                      size="sm"
                      :items="DOCUMENT_CATEGORY_OPTIONS"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>

              <!-- Upload Button -->
              <div class="flex justify-end">
                <UButton
                  icon="i-hugeicons-upload-01"
                  color="primary"
                  size="sm"
                  :loading="documentLoading"
                  :disabled="documentLoading || uploadedFiles.length === 0"
                  @click="uploadDocuments"
                >
                  Téléverser {{ uploadedFiles.length }} document(s)
                </UButton>
              </div>
            </div>

            <!-- Existing Documents -->
            <div class="space-y-3">
              <UEmpty
                v-if="!hasDocuments"
                icon="i-hugeicons-file-add"
                size="sm"
                variant="subtle"
                title="Aucun document"
                description="Ce patient n'a pas encore de document."
                :actions="[
                  {
                    label: 'Ajouter un document',
                    icon: 'i-hugeicons-plus-sign',
                    color: 'primary',
                    onClick: openFileDialog
                  }
                ]"
              />

              <DocumentCard
                v-for="doc in documents"
                :key="doc.id"
                :document="doc"
                :patient-id="treatmentPlan.patientId"
                variant="mini"
              />
            </div>
          </div>

          <div v-if="hasDocuments" class="flex w-full justify-end">
            <UButton
              label="Document"
              icon="i-hugeicons-plus-sign"
              color="primary"
              variant="soft"
              size="sm"
              @click="openFileDialog"
            />
          </div>
        </div>
      </template>
    </UCollapsible>
  </UCard>
</template>
