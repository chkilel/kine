<script setup lang="ts">
  import { LazyDocumentViewerModal } from '#components'

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
  const { mutate: updateDocument, isLoading: isUpdating } = useUpdateDocument(() => props.treatmentPlan.patientId)
  const { mutate: deleteDocument, isLoading: isDeleting } = useDeleteDocument(() => props.treatmentPlan.patientId)

  const editingDocument = ref<PatientDocument | null>(null)
  const showDeleteModal = ref(false)
  const documentToDelete = ref<PatientDocument | null>(null)
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
  function confirmDeleteDocument(document: PatientDocument) {
    documentToDelete.value = document
    showDeleteModal.value = true
  }

  function cancelDeleteDocument() {
    documentToDelete.value = null
    showDeleteModal.value = false
  }

  async function executeDeleteDocument() {
    if (!documentToDelete.value) return

    try {
      deleteDocument({ documentId: documentToDelete.value.id })

      // Optimistic UI update
      if (documents.value) {
        documents.value = documents.value.filter((doc) => doc.id !== documentToDelete.value?.id)
      }

      cancelDeleteDocument()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Keyboard shortcuts
  onKeyStroke('Escape', () => {
    if (editingDocument.value) {
      cancelEditDocument()
    }
  })
</script>

<template>
  <AppCard variant="outline" title="Documents du plan de traitement">
    <template #actions>
      <UButton v-if="hasDocuments" icon="i-lucide-plus" color="primary" size="sm" @click="openFileDialog">
        Ajouter un document
      </UButton>
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
          class="border-default bg-muted space-y-3 rounded-xl border p-4"
        >
          <div class="flex w-full items-start gap-10">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ uploadedFile.file.name }}</p>
              <p class="text-muted mt-1 text-xs">
                Prêt pour le téléversement • {{ (uploadedFile.file.size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
            <UButton icon="i-lucide-trash" variant="ghost" color="error" size="sm" square @click="removeFile(index)" />
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

        <!-- Upload Button -->
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-upload"
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
          icon="i-lucide-file-plus"
          title="Aucun document"
          description="Ce patient n'a pas encore de document. Ajoutez-en un pour commencer le suivi."
          :actions="[
            {
              label: 'Ajouter un document',
              icon: 'i-lucide-plus',
              color: 'primary',
              onClick: openFileDialog
            }
          ]"
        />

        <div
          v-for="doc in documents"
          :key="doc.id"
          class="border-default flex items-start gap-4 rounded-lg border p-3"
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
              <p class="text-default grow font-semibold">{{ doc.originalFileName }}</p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <UFormField label="Titre descriptif du document" size="xs" class="sm:col-span-2">
                <UInput v-model="editingDocument.description" placeholder="Titre descriptif" size="sm" />
              </UFormField>
              <UFormField label="Type de document" size="xs">
                <USelectMenu
                  v-model="editingDocument.category"
                  value-key="value"
                  size="sm"
                  :items="DOCUMENT_CATEGORY_OPTIONS"
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
          <div v-else class="flex w-full items-center gap-4">
            <UBadge
              :icon="getDocumentIcon(doc.category)"
              :color="getDocumentColor(doc.category)"
              variant="soft"
              size="lg"
              square
            />
            <div class="grow">
              <p class="text-default font-semibold">{{ doc.originalFileName }}</p>
              <div class="text-muted mt-1 flex items-center gap-x-2 text-xs">
                <span>{{ getDocumentCategoryLabel(doc.category) }}</span>
                <span class="text-muted">•</span>
                <span>{{ doc.description || 'Aucune description' }}</span>
                <span class="text-muted">•</span>
                <span>{{ new Date(doc.createdAt).toLocaleDateString('fr-FR') }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <LazyDocumentViewerModal :document="doc" :patientId="props.treatmentPlan.patientId" />
              <UButton
                icon="i-lucide-edit"
                variant="ghost"
                color="neutral"
                size="sm"
                square
                :disabled="!!editingDocument"
                @click="startEditDocument(doc)"
              />
              <UButton
                icon="i-lucide-trash"
                variant="ghost"
                color="error"
                size="sm"
                square
                :loading="isDeleting && documentToDelete?.id === doc.id"
                :disabled="isDeleting"
                @click="confirmDeleteDocument(doc)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <AppCard>
          <div class="mb-4 flex items-center gap-3">
            <UBadge
              icon="i-lucide-trash-2"
              color="error"
              variant="subtle"
              size="xl"
              class="flex size-12 shrink-0 items-center justify-center rounded-full"
            />
            <div>
              <h3 class="text-lg font-semibold">Supprimer le document</h3>
              <p class="text-muted text-sm">
                Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
              </p>
            </div>
          </div>

          <div v-if="documentToDelete" class="bg-muted mb-6 rounded-lg p-3">
            <div class="flex items-center gap-3">
              <UBadge
                :icon="getDocumentIcon(documentToDelete.category)"
                :color="getDocumentColor(documentToDelete.category)"
                variant="soft"
                size="lg"
                square
              />
              <div>
                <p class="font-medium">{{ documentToDelete.originalFileName }}</p>
                <p class="text-muted text-xs">
                  {{ getDocumentCategoryLabel(documentToDelete.category) }} •
                  {{ new Date(documentToDelete.createdAt).toLocaleDateString('fr-FR') }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <UButton variant="outline" color="neutral" @click="cancelDeleteDocument">Annuler</UButton>
            <UButton color="error" :loading="isDeleting" :disabled="isDeleting" @click="executeDeleteDocument">
              Supprimer
            </UButton>
          </div>
        </AppCard>
      </template>
    </UModal>
  </AppCard>
</template>
