<script setup lang="ts">
  const props = defineProps<{
    document: PatientDocument
    patientId: string
  }>()

  const open = ref(false)
  const documentUrl = ref<string>('')
  const loading = ref(false)
  const error = ref<string>('')

  const { getPresignUrl } = useUploads()

  const openModal = async () => {
    loading.value = true
    error.value = ''

    try {
      console.log('DocumentViewerModal - Attempting to load document with key:', props.document.storageKey)
      documentUrl.value = await getPresignUrl(props.document.storageKey)
      console.log('DocumentViewerModal - Got presigned URL:', documentUrl.value)
      open.value = true
    } catch (err: any) {
      error.value = err.message || 'Failed to load document'
      console.error('Error loading document:', err)
    } finally {
      loading.value = false
    }
  }

  const downloadDocument = async () => {
    console.log('🚀 >>> ', 'props.document.storageKey', ': ', props.document.storageKey)

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

  function isViewableByBrowser(mimeType: string): boolean {
    const viewableTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
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

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'i-lucide-image'
    if (mimeType.startsWith('video/')) return 'i-lucide-video'
    if (mimeType.startsWith('audio/')) return 'i-lucide-music'
    if (mimeType === 'application/pdf') return 'i-lucide-file-text'
    if (mimeType.startsWith('text/')) return 'i-lucide-file-text'
    return 'i-lucide-file'
  }
</script>

<template>
  <div>
    <!-- View Button (if viewable) -->
    <UButton
      v-if="isViewableByBrowser(document.mimeType)"
      icon="i-lucide-eye"
      variant="ghost"
      color="neutral"
      size="sm"
      square
      :loading="loading"
      @click="openModal"
    />

    <!-- Download Button -->
    <UButton icon="i-lucide-download" variant="ghost" color="neutral" size="sm" square @click="downloadDocument" />

    <!-- Document Viewer Modal -->
    <UModal v-model:open="open" class="w-full max-w-7xl">
      <template #content>
        <UCard class="w-full max-w-7xl">
          <div class="flex items-center justify-between border-b p-4">
            <div class="flex items-center gap-3">
              <UIcon :name="getFileIcon(document.mimeType)" class="text-2xl" />
              <div>
                <h3 class="font-semibold">{{ document.originalFileName }}</h3>
                <p class="text-muted text-sm">{{ document.mimeType }}</p>
                <p class="text-muted text-xs">Key: {{ document.storageKey }}</p>
              </div>
            </div>
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" square @click="open = false" />
          </div>

          <div class="p-4">
            <div v-if="error" class="bg-error/10 border-error/20 text-error rounded-lg border p-4">
              <p class="font-medium">Erreur de chargement</p>
              <p class="text-sm">{{ error }}</p>
            </div>

            <div v-else-if="loading" class="flex items-center justify-center py-12">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
                <span class="text-muted">Chargement du document...</span>
              </div>
            </div>

            <div v-else class="max-h-[80vh] overflow-auto">
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
                class="mx-auto max-w-full rounded shadow-lg"
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
                <UButton icon="i-lucide-download" color="primary" class="mt-4" @click="downloadDocument">
                  Télécharger le fichier
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
