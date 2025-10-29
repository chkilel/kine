<script setup lang="ts">
  import type { PatientDocument } from '~~/shared/types/patient.types'

  const props = defineProps<{
    patientId: string
    documents: PatientDocument[]
  }>()

  const emit = defineEmits<{
    deleted: [documentId: string]
    refreshed: []
  }>()

  const toast = useToast()

  async function deleteDocument(document: PatientDocument) {
    if (!confirm(`Are you sure you want to delete "${document.originalName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await $fetch(`/api/patients/${props.patientId}/documents/${document.id}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Success',
        description: 'Document deleted successfully',
        color: 'success'
      })

      emit('deleted', document.id)
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || 'Failed to delete document',
        color: 'error'
      })
    }
  }

  async function downloadDocument(doc: PatientDocument) {
    try {
      const response = await $fetch(`/api/patients/${props.patientId}/documents/${doc.id}`)

      // Create download link
      const link = document.createElement('a')
      link.href = response.downloadUrl
      link.download = doc.originalName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || 'Failed to download document',
        color: 'error'
      })
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  function getCategoryColor(
    category: string
  ): 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral' {
    const colors: Record<string, 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'> = {
      referral: 'primary',
      imaging: 'success',
      lab_results: 'warning',
      treatment_notes: 'info',
      other: 'neutral'
    }
    return colors[category] || 'neutral'
  }

  function getCategoryIcon(category: string) {
    const icons = {
      referral: 'i-lucide-user-plus',
      imaging: 'i-lucide-image',
      lab_results: 'i-lucide-flask',
      treatment_notes: 'i-lucide-file-text',
      other: 'i-lucide-file'
    }
    return icons[category as keyof typeof icons] || 'i-lucide-file'
  }
</script>

<template>
  <div v-if="documents.length === 0" class="py-8 text-center">
    <UIcon name="i-lucide-file-text" class="text-muted-foreground mb-4 text-4xl" />
    <h3 class="mb-2 text-lg font-medium">No documents</h3>
    <p class="text-muted-foreground">No documents have been uploaded for this patient yet.</p>
  </div>

  <div v-else class="space-y-4">
    <div
      v-for="document in documents"
      :key="document.id"
      class="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
    >
      <div class="flex items-start justify-between">
        <div class="flex flex-1 items-start gap-3">
          <div class="bg-muted rounded-lg p-2">
            <UIcon :name="getCategoryIcon(document.category)" class="text-xl" />
          </div>

          <div class="min-w-0 flex-1">
            <h4 class="truncate font-medium">{{ document.originalName }}</h4>
            <p v-if="document.description" class="text-muted-foreground mt-1 text-sm">{{ document.description }}</p>

            <div class="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
              <UBadge :color="getCategoryColor(document.category)" variant="subtle" size="xs">
                {{ document.category.replace('_', ' ') }}
              </UBadge>
              <span>{{ formatFileSize(document.fileSize) }}</span>
              <span>{{ formatDate(document.uploadedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="ml-4 flex items-center gap-2">
          <UButton
            icon="i-lucide-download"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="downloadDocument(document)"
          >
            Download
          </UButton>

          <UButton icon="i-lucide-trash" size="sm" color="error" variant="ghost" @click="deleteDocument(document)">
            Delete
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
