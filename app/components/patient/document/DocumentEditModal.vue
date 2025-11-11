<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import type { PatientDocument } from '~~/shared/types/patient.types'

  const props = defineProps<{
    document: PatientDocument
    patientId: string
  }>()

  const emit = defineEmits<{
    updated: [document: PatientDocument]
  }>()

  const schema = z.object({
    category: z.enum(['referral', 'imaging', 'lab_results', 'treatment_notes', 'other']),
    description: z.string().optional()
  })

  const open = ref(false)
  const isUpdating = ref(false)

  type Schema = z.output<typeof schema>

  const state = reactive<Schema>({
    category: props.document.category,
    description: props.document.description || ''
  })

  const toast = useToast()

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    isUpdating.value = true

    try {
      const updatedDocument = await $fetch(`/api/patients/${props.patientId}/documents/${props.document.id}`, {
        method: 'PUT',
        body: {
          category: event.data.category,
          description: event.data.description
        }
      })

      toast.add({
        title: 'Succès',
        description: 'Document mis à jour avec succès',
        color: 'success'
      })

      emit('updated', updatedDocument)
      open.value = false
    } catch (error: any) {
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la mise à jour du document',
        color: 'error'
      })
    } finally {
      isUpdating.value = false
    }
  }

  function openModal() {
    state.category = props.document.category
    state.description = props.document.description || ''
    open.value = true
  }
</script>

<template>
  <UModal v-model:open="open" title="Modifier le document" description="Mettre à jour les informations du document">
    <UButton icon="i-lucide-edit" size="sm" color="neutral" variant="ghost" @click="openModal">Modifier</UButton>

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Document Info -->
        <div class="bg-muted rounded-lg p-3">
          <p class="font-medium">{{ document.originalName }}</p>
          <p class="text-muted-foreground text-sm">
            {{ document.mimeType }} • {{ Math.round(document.fileSize / 1024) }} Ko
          </p>
        </div>

        <!-- Document Category -->
        <UFormField label="Catégorie" name="category">
          <USelect
            v-model="state.category"
            class="w-full"
            :items="[
              { label: 'Références', value: 'referral' },
              { label: 'Imagerie', value: 'imaging' },
              { label: 'Résultats de laboratoire', value: 'lab_results' },
              { label: 'Notes de traitement', value: 'treatment_notes' },
              { label: 'Autre', value: 'other' }
            ]"
          />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" placeholder="Description facultative du document" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="3" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" :loading="isUpdating" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
