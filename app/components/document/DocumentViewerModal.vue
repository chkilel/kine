<script setup lang="ts">
  const props = defineProps<{
    document: PatientDocument
    patientId: string
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const documentUrl = ref<string>('')
  const loading = ref(true)
  const error = ref<string>('')

  const { getPresignUrl } = useUploads()

  // Load document when document prop changes
  async function loadDocument() {
    loading.value = true
    error.value = ''
    documentUrl.value = ''

    try {
      console.log('DocumentViewerModal - Attempting to load document with key:', props.document.storageKey)
      documentUrl.value = await getPresignUrl(props.document.storageKey)
      console.log('DocumentViewerModal - Got presigned URL:', documentUrl.value)
    } catch (err: any) {
      error.value = err.message || 'Failed to load document'
      console.error('Error loading document:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(loadDocument)

  watch(() => props.document, loadDocument, { deep: true })

  const downloadDocument = async () => {
    try {
      console.log('DocumentViewerModal - Attempting to download document with key:', props.document.storageKey)
      const url = await getPresignUrl(props.document.storageKey)
      console.log('DocumentViewerModal - Got presigned URL for download:', url)
      const link = document.createElement('a')
      link.href = url
      link.download = props.document.originalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      console.error('Error downloading document:', err)
      const toast = useToast()
      toast.add({
        title: 'Erreur',
        description: 'Échec du téléchargement du document',
        color: 'error'
      })
    }
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'i-hugeicons-image-01'
    if (mimeType.startsWith('video/')) return 'i-hugeicons-video-01'
    if (mimeType.startsWith('audio/')) return 'i-hugeicons-music-note-01'
    if (mimeType === 'application/pdf') return 'i-hugeicons-file-02'
    if (mimeType.startsWith('text/')) return 'i-hugeicons-file-02'
    return 'i-hugeicons-file-01'
  }
</script>

<template>
  <UModal scrollable :ui="{ content: 'w-full max-w-6xl' }">
    <template #title>
      <div class="flex items-center gap-3">
        <UIcon :name="getFileIcon(document.mimeType)" class="text-2xl" />
        <h3 class="font-semibold">{{ document.originalFileName }}</h3>
      </div>
    </template>
    <template #description>
      <div class="text-muted mt-1 flex items-center gap-x-2 text-xs">
        <span>{{ getDocumentCategoryLabel(document.category) }}</span>
        <span class="text-muted">•</span>
        <span>{{ new Date(document.createdAt).toLocaleDateString('fr-FR') }}</span>
      </div>
    </template>
    <template #body>
      <div v-if="error" class="bg-error/10 border-error/20 text-error rounded-lg border p-4">
        <p class="font-medium">Erreur de chargement</p>
        <p class="text-sm">{{ error }}</p>
      </div>

      <div v-else-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <UIcon name="i-hugeicons-loading-03" class="size-5 animate-spin" />
          <span class="text-muted">Chargement du document...</span>
        </div>
      </div>

      <div v-else class="overflow-auto">
        <!-- PDF Viewer -->
        <iframe
          v-if="document.mimeType === 'application/pdf'"
          :src="documentUrl"
          class="h-[80vh] w-full rounded border"
          title="PDF Document"
        />

        <!-- Image Viewer -->
        <img
          v-else-if="document.mimeType.startsWith('image/')"
          :src="documentUrl"
          :alt="document.originalFileName"
          class="mx-auto max-h-[80vh] max-w-full rounded object-contain shadow-lg"
        />

        <!-- Video Viewer -->
        <video
          v-else-if="document.mimeType.startsWith('video/')"
          :src="documentUrl"
          controls
          class="mx-auto max-w-full rounded"
        >
          Votre navigateur ne supporte pas la lecture de cette vidéo.
        </video>

        <!-- Audio Viewer -->
        <audio
          v-else-if="document.mimeType.startsWith('audio/')"
          :src="documentUrl"
          controls
          class="mx-auto w-full max-w-md"
        >
          Votre navigateur ne supporte pas la lecture de cet audio.
        </audio>

        <!-- Text/Code Viewer -->
        <iframe
          v-else-if="document.mimeType.startsWith('text/') || document.mimeType === 'application/json'"
          :src="documentUrl"
          class="h-[80vh] w-full rounded border font-mono text-sm"
          title="Text Document"
        />

        <!-- Fallback -->
        <div v-else class="py-12 text-center">
          <UIcon :name="getFileIcon(document.mimeType)" class="text-muted mb-4 text-6xl" />
          <p class="text-muted">Ce type de fichier ne peut pas être affiché directement.</p>
          <UButton icon="i-hugeicons-download-01" color="primary" class="mt-4" @click="downloadDocument">
            Télécharger le fichier
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
