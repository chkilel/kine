<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui'
  import { LazyDocumentViewerModal, LazyAppModalConfirm } from '#components'

  interface UploadedFile {
    file: File
    title: string
    type: DocumentCategory
    stagedAt: Date
  }

  const props = defineProps<{ treatmentPlan: TreatmentPlan }>()

  const overlay = useOverlay()
  const confirmModal = overlay.create(LazyAppModalConfirm)
  const documentViewerModal = overlay.create(LazyDocumentViewerModal)
  const toast = useToast()
  const queryCache = useQueryCache()

  const { uploadFile, getPresignUrl } = useUploads()
  const { data: documents } = useDocumentsList(
    () => props.treatmentPlan.patientId,
    () => props.treatmentPlan.id
  )
  const { mutate: updateDocument, isLoading: isUpdating } = useUpdateDocument(() => props.treatmentPlan.patientId)
  const { mutate: deleteDocument, isLoading: isDeleting } = useDeleteDocument(() => props.treatmentPlan.patientId)

  const editingDocument = ref<PatientDocument | null>(null)
  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()
  const documentLoading = ref(false)

  // Download document
  const downloadDocument = async (doc: PatientDocument) => {
    try {
      const url = await getPresignUrl(doc.storageKey)
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = doc.originalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err: any) {
      console.error('Error downloading document:', err)
      toast.add({
        title: 'Erreur',
        description: 'Échec du téléchargement du document',
        color: 'error'
      })
    }
  }

  // Dropdown menu items for document actions
  function getDocumentActions(doc: PatientDocument): DropdownMenuItem[][] {
    return [
      [
        {
          label: 'Télécharger',
          icon: 'i-hugeicons-download-01',
          onSelect: () => downloadDocument(doc)
        },
        {
          label: 'Modifier',
          icon: 'i-hugeicons-pencil-edit-01',
          disabled: !!editingDocument.value,
          onSelect: () => startEditDocument(doc)
        }
      ],
      [
        {
          label: 'Supprimer',
          icon: 'i-hugeicons-delete-02',
          color: 'error',
          disabled: isDeleting.value,
          onSelect: () => confirmDeleteDocument(doc)
        }
      ]
    ]
  }

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

  // Edit functions
  function startEditDocument(document: PatientDocument) {
    editingDocument.value = { ...document }
  }

  function cancelEditDocument() {
    editingDocument.value = null
  }

  async function saveDocumentEdit() {
    if (!editingDocument.value) return

    try {
      updateDocument({
        documentId: editingDocument.value.id,
        data: {
          description: editingDocument.value.description || undefined,
          category: editingDocument.value.category
        }
      })
      cancelEditDocument()
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  // Delete functions
  async function confirmDeleteDocument(document: PatientDocument) {
    const confirmed = await confirmModal.open({
      title: 'Supprimer le document',
      message: `Êtes-vous sûr de vouloir supprimer "${document.originalFileName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-hugeicons-delete-02'
    })

    if (confirmed) {
      try {
        deleteDocument({ documentId: document.id })

        // Optimistic UI update
        if (documents.value) {
          documents.value = documents.value.filter((doc) => doc.id !== document.id)
        }
      } catch (error) {
        console.error('Error deleting document:', error)
      }
    }
  }

  // Keyboard shortcuts
  onKeyStroke('Escape', () => {
    if (editingDocument.value) {
      cancelEditDocument()
    }
  })

  function isViewableByBrowser(mimeType: string): boolean {
    const viewableTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ]
    return viewableTypes.includes(mimeType)
  }
</script>

<template>
  <AppCard variant="outline" title="Documents du plan">
    <template #actions>
      <UButton
        v-if="hasDocuments"
        icon="i-hugeicons-plus-sign"
        color="primary"
        variant="ghost"
        size="sm"
        @click="openFileDialog"
      />
    </template>
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

        <div
          v-for="doc in documents"
          :key="doc.id"
          class="border-default bg-muted flex items-start gap-4 space-y-2 rounded-md border p-2"
          :class="{ 'ring-neutral ring-2 ring-offset-2': editingDocument?.id === doc.id }"
        >
          <!-- Edit Mode -->
          <div v-if="editingDocument?.id === doc.id" class="w-full space-y-3">
            <div class="flex items-center gap-3">
              <UBadge
                :icon="getDocumentIcon(editingDocument.category)"
                :color="getDocumentColor(editingDocument.category)"
                variant="soft"
                size="lg"
                square
              />
              <p class="text-default text-sm font-medium">{{ doc.description || doc.originalFileName }}</p>
            </div>
            <div class="grid gap-4">
              <UFormField label="Titre descriptif du document" size="xs">
                <UInput
                  v-model="editingDocument.description"
                  variant="outline"
                  placeholder="Titre descriptif"
                  size="sm"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Type de document" size="xs">
                <USelect
                  v-model="editingDocument.category"
                  value-key="value"
                  variant="outline"
                  size="sm"
                  :items="DOCUMENT_CATEGORY_OPTIONS"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-2">
              <UButton variant="outline" color="neutral" size="sm" @click="cancelEditDocument">Annuler</UButton>
              <UButton color="primary" size="sm" :loading="isUpdating" :disabled="isUpdating" @click="saveDocumentEdit">
                Enregistrer
              </UButton>
            </div>
          </div>

          <!-- View Mode -->
          <div v-else class="flex w-full flex-col gap-1">
            <div class="flex items-start gap-4">
              <UBadge
                :icon="getDocumentIcon(doc.category)"
                :color="getDocumentColor(doc.category)"
                variant="soft"
                size="lg"
                square
              />
              <div class="min-w-0 grow">
                <p class="text-xs uppercase">{{ getDocumentCategoryLabel(doc.category) }}</p>
                <p class="text-default truncate text-sm font-medium">{{ doc.description || doc.originalFileName }}</p>
                <div class="mt-1 flex items-center justify-between gap-x-2">
                  <span class="text-muted text-xs">
                    {{ new Date(doc.createdAt).toLocaleDateString('fr-FR') }}
                  </span>

                  <div class="flex items-center justify-end gap-1">
                    <UButton
                      v-if="isViewableByBrowser(doc.mimeType)"
                      icon="i-hugeicons-view"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      square
                      @click="documentViewerModal.open({ document: doc, patientId: props.treatmentPlan.patientId })"
                    />
                    <UDropdownMenu size="sm" :items="getDocumentActions(doc)" :content="{ align: 'end' }">
                      <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" size="sm" square />
                    </UDropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
