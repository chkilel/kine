<script setup lang="ts">
  import { parseISO } from 'date-fns'
  import { LazyDocumentViewerModal } from '#components'

  // Types
  interface UploadedFile {
    file: File
    title: string
    type: DocumentCategory
    stagedAt: Date
  }

  const props = defineProps<{
    patient: Patient
    treatmentPlan: TreatmentPlan
  }>()

  const toast = useToast()
  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()
  const { uploadFile } = useUploads()
  const { updateDocument, deleteDocument, isUpdating, isDeleting } = useDocuments(() => props.patient.id)

  // Edit mode state
  const editingDocument = ref<PatientDocument | null>(null)

  // Delete confirmation modal
  const showDeleteModal = ref(false)
  const documentToDelete = ref<PatientDocument | null>(null)

  // Documents state
  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()
  const documentLoading = ref(false)

  // Docuement Fetch Query
  const { data: documents } = useQuery({
    key: () => {
      const planId = props.treatmentPlan.id
      const patientId = props.patient.id
      return ['documents', patientId, planId]
    },
    query: async () => {
      const planId = props.treatmentPlan.id

      return requestFetch(`/api/patients/${props.patient.id}/documents?treatmentPlanId=${planId}`).then((data) =>
        data.map((plan) => ({
          ...plan,
          createdAt: parseISO(plan.createdAt),
          updatedAt: parseISO(plan.updatedAt),
          deletedAt: toDate(plan.deletedAt)
        }))
      )
    },
    enabled: () => !!props.treatmentPlan?.id
  })

  // File management func
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
        type: 'other',
        stagedAt: new Date()
      }
      uploadedFiles.value.push(uploadedFile)
    }
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  // Upload documents and link to treatment plan
  const uploadDocuments = async ({
    planId,
    patientId,
    organizationId
  }: {
    planId?: string
    patientId: string
    organizationId: string
  }) => {
    if (uploadedFiles.value.length === 0) return

    documentLoading.value = true
    if (!planId) {
      toast.add({
        title: 'Erreur',
        description: 'Aucun plan de traitement actif',
        color: 'error'
      })
      documentLoading.value = false
      return
    }

    try {
      const uploadedDocuments = []

      for (const uploadedFile of uploadedFiles.value) {
        try {
          // Upload file to R2 and get actual storage key
          console.log('Uploading file:', uploadedFile.file.name)
          const uploadResult = await uploadFile({
            file: uploadedFile.file,
            folder: `orgs/${organizationId}/docs/${patientId}`,
            name: uploadedFile.file.name
          })
          console.log('Upload result:', uploadResult)

          // Create document record with the actual storage key
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
          console.log('Document data to save:', documentData)

          const document = await $fetch(`/api/patients/${patientId}/documents`, {
            method: 'POST',
            body: documentData
          })

          if (!document) {
            throw new Error('Failed to create document record')
          }

          uploadedDocuments.push(document)
        } catch (error) {
          console.error('Error uploading file:', error)
          toast.add({
            title: 'Erreur',
            description: `Échec du téléversement de ${uploadedFile.file.name}`,
            color: 'error'
          })
        }
      }

      // Clear staged files and refresh document list
      uploadedFiles.value = []

      if (uploadedDocuments.length > 0) {
        queryCache.invalidateQueries({ key: ['documents', patientId, planId] })
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
  const startEditDocument = (document: PatientDocument) => {
    editingDocument.value = { ...document }
  }

  const cancelEditDocument = () => {
    editingDocument.value = null
  }

  const saveDocumentEdit = async () => {
    if (!editingDocument.value || !props.patient.id) return

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
  const confirmDeleteDocument = (document: PatientDocument) => {
    documentToDelete.value = document
    showDeleteModal.value = true
  }

  const cancelDeleteDocument = () => {
    documentToDelete.value = null
    showDeleteModal.value = false
  }

  const executeDeleteDocument = async () => {
    if (!documentToDelete.value || !props.patient.id) return

    try {
      deleteDocument(documentToDelete.value.id)

      // Remove from local state optimistically
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
    if (editingDocument.value?.id) {
      cancelEditDocument()
    }
  })
</script>

<template>
  <UCard variant="outline">
    <div class="mb-5 flex items-center justify-between">
      <h3 class="text-base font-bold">Documents du plan de traitement</h3>
      <div class="flex items-center gap-2">
        <!-- Add Document Button -->
        <UButton
          v-if="uploadedFiles.length > 0 || (documents && documents?.length > 0)"
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          @click="fileInputRef?.click()"
        >
          Ajouter un document
        </UButton>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        @change="handleFileSelect"
      />
    </div>
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
              <p class="truncate text-sm font-medium">
                {{ uploadedFile.file.name }}
              </p>
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

        <!-- Upload Button for Staged Files -->
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-upload"
            color="primary"
            size="sm"
            :loading="documentLoading"
            :disabled="documentLoading || uploadedFiles.length === 0"
            @click="
              uploadDocuments({
                patientId: props.patient.id,
                organizationId: props.patient.organizationId,
                planId: props.treatmentPlan.id
              })
            "
          >
            Téléverser {{ uploadedFiles.length }} document(s)
          </UButton>
        </div>
      </div>

      <!-- Existing Documents -->
      <div class="space-y-3 pt-4">
        <UEmpty
          v-if="!documents?.length && !uploadedFiles.length"
          icon="i-lucide-file-plus"
          title="Aucun document"
          description="Ce patient n'a pas encore de document. Ajoutez-en un pour commencer le suivi."
          :actions="[
            {
              label: 'Ajouter un document',
              icon: 'i-lucide-plus',
              color: 'primary',
              onClick: () => fileInputRef?.click()
            }
          ]"
        />
        <div
          v-else
          v-for="doc in documents"
          :key="doc.id"
          class="border-default flex items-start gap-4 rounded-lg border p-3"
          :class="{ 'ring-neutral ring-2 ring-offset-2': editingDocument?.id === doc.id }"
        >
          <!-- Edit Mode -->
          <div v-if="editingDocument?.id === doc.id" class="w-full space-y-3">
            <div class="flex items-center gap-3">
              <UBadge
                :icon="getDocumentIcon(editingDocument?.category || doc.category)"
                :color="getDocumentColor(editingDocument?.category || doc.category)"
                variant="soft"
                size="lg"
                square
              />
              <div class="grow">
                <p class="text-default font-semibold">{{ doc.originalFileName }}</p>
              </div>
            </div>

            <div v-if="editingDocument" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <UFormField label="Titre descriptif du document" size="xs" class="sm:col-span-2">
                <UInput v-model="editingDocument.description" placeholder="Titre descriptif" size="sm" class="w-full" />
              </UFormField>
              <UFormField label="Type de document" size="xs">
                <USelectMenu
                  v-model="editingDocument.category"
                  value-key="value"
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
              <LazyDocumentViewerModal :document="doc" :patient-id="props.patient.id" />
              <UButton
                icon="i-lucide-edit"
                variant="ghost"
                color="neutral"
                size="sm"
                square
                :disabled="!!editingDocument?.id"
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
        <UCard>
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
        </UCard>
      </template>
    </UModal>
  </UCard>
</template>
