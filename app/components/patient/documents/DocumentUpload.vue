<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{
    patientId: string
  }>()

  const emit = defineEmits<{
    uploaded: [document: any]
  }>()

  const schema = z.object({
    category: z.enum(['referral', 'imaging', 'lab_results', 'treatment_notes', 'other']),
    description: z.string().optional()
  })

  const open = ref(false)
  const isUploading = ref(false)
  const selectedFile = ref<File | null>(null)

  type Schema = z.output<typeof schema>

  const state = reactive<Partial<Schema>>({
    category: undefined,
    description: undefined
  })

  const toast = useToast()

  function onFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      selectedFile.value = target.files[0] || null
    } else {
      selectedFile.value = null
    }
  }

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (!selectedFile.value) {
      toast.add({
        title: 'Error',
        description: 'Please select a file to upload',
        color: 'error'
      })
      return
    }

    isUploading.value = true

    try {
      // First upload file to R2 using existing upload infrastructure
      const formData = new FormData()
      formData.append('file', selectedFile.value)

      const uploadResponse = (await $fetch('/api/r2/blob.post', {
        method: 'POST',
        body: formData
      })) as { fileName: string; storageKey: string }

      // Then create document record in database
      const documentData = {
        fileName: uploadResponse.fileName,
        originalName: selectedFile.value.name,
        mimeType: selectedFile.value.type,
        fileSize: selectedFile.value.size,
        storageKey: uploadResponse.storageKey,
        category: event.data.category,
        description: event.data.description
      }

      const document = await $fetch(`/api/patients/${props.patientId}/documents`, {
        method: 'POST',
        body: documentData
      })

      toast.add({
        title: 'Success',
        description: 'Document uploaded successfully',
        color: 'success'
      })

      emit('uploaded', document)

      // Reset form
      selectedFile.value = null
      state.category = undefined
      state.description = undefined
      open.value = false
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || 'Failed to upload document',
        color: 'error'
      })
    } finally {
      isUploading.value = false
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
</script>

<template>
  <UModal v-model:open="open" title="Upload Document" description="Upload a new document for this patient">
    <UButton label="Upload Document" icon="i-lucide-upload" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- File Upload -->
        <div>
          <label class="mb-2 block text-sm font-medium">Select File</label>
          <input
            type="file"
            @change="onFileSelect"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            class="file:bg-primary hover:file:bg-primary/80 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <div v-if="selectedFile" class="bg-muted mt-2 rounded-lg p-3">
            <p class="font-medium">{{ selectedFile.name }}</p>
            <p class="text-muted-foreground text-sm">
              {{ formatFileSize(selectedFile.size) }} • {{ selectedFile.type }}
            </p>
          </div>
        </div>

        <!-- Document Category -->
        <UFormField label="Category" name="category">
          <USelect
            v-model="state.category"
            class="w-full"
            :items="[
              { label: 'Referral', value: 'referral' },
              { label: 'Imaging', value: 'imaging' },
              { label: 'Lab Results', value: 'lab_results' },
              { label: 'Treatment Notes', value: 'treatment_notes' },
              { label: 'Other', value: 'other' }
            ]"
          />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" placeholder="Optional description of the document" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="3" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton
            label="Upload"
            color="primary"
            variant="solid"
            type="submit"
            :loading="isUploading"
            :disabled="!selectedFile"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
