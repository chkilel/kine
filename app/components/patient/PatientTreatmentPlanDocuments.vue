<script setup lang="ts">
  import { useUploads } from '~/composables/useUploads'

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

  // Documents state
  const uploadedFiles = ref<UploadedFile[]>([])
  const fileInputRef = ref<HTMLInputElement>()
  const documentLoading = ref(false)

  // Docuement Fetch Query
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    key: () => {
      const planId = props.treatmentPlan?.id
      const patientId = props.patient.id
      return planId ? ['documents', patientId, planId] : ['documents', 'no-plan']
    },
    query: async () => {
      const planId = props.treatmentPlan?.id
      if (!planId) return []

      const result = await requestFetch(`/api/patients/${props.patient.id}/documents?treatmentPlanId=${planId}`)
      return result || []
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
          // Upload file to R2
          const fileName = `${Date.now()}-${uploadedFile.file.name}`
          const folder = `orgs/${organizationId}/docs/${patientId}`
          const storageKey = `${folder}/${fileName}`

          await uploadFile({
            file: uploadedFile.file,
            folder: `orgs/${organizationId}/docs/${patientId}`,
            name: fileName
          })

          // Create document record
          const documentData = {
            organizationId,
            treatmentPlanId: planId,
            fileName,
            originalFileName: uploadedFile.file.name,
            mimeType: uploadedFile.file.type,
            fileSize: uploadedFile.file.size,
            storageKey,
            category: uploadedFile.type,
            description: uploadedFile.title
          }

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
</script>

<template>
  <UCard variant="outline">
    <h3 class="text-highlighted mb-4 text-base font-bold">Documents du plan de traitement</h3>
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
        <div v-if="!documents?.length" class="py-4 text-center">
          <p class="text-muted text-sm">Aucun document pour ce plan de traitement</p>
        </div>
        <div
          v-else
          v-for="doc in documents"
          :key="doc.id"
          class="border-default flex items-center gap-4 rounded-lg border p-3"
        >
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
              <span>{{ doc.originalFileName }}</span>
              <span class="text-muted">•</span>
              <span>{{ new Date(doc.createdAt).toLocaleDateString('fr-FR') }}</span>
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
        @click="fileInputRef?.click()"
      >
        Joindre un document
      </UButton>
    </div>
  </UCard>
</template>
