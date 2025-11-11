<script setup lang="ts">
  interface Props {
    count?: number
    selectedIds?: string[]
  }

  const props = withDefaults(defineProps<Props>(), { count: 0, selectedIds: () => [] })

  const open = ref(false)
  const toast = useToast()

  async function onSubmit() {
    if (props.selectedIds.length === 0) {
      toast.add({
        title: 'Erreur',
        description: 'Aucun patient sélectionné pour la suppression',
        color: 'error'
      })
      return
    }

    try {
      // Delete each selected patient
      for (const patientId of props.selectedIds) {
        await $fetch(`/api/patients/${patientId}`, {
          method: 'DELETE'
        })
      }

      toast.add({
        title: 'Succès',
        description: `${props.selectedIds.length} patient${props.selectedIds.length > 1 ? 's' : ''} supprimé${props.selectedIds.length > 1 ? 's' : ''} avec succès`,
        color: 'success'
      })

      open.value = false

      // Refresh the patient list
      await refreshNuxtData()
    } catch (error: any) {
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la suppression des patients',
        color: 'error'
      })
    }
  }
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Supprimer ${count} patient${count > 1 ? 's' : ''}`"
    :description="`Êtes‑vous sûr ? Cette action est irréversible et supprimera toutes les fiches patient.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Supprimer" color="error" variant="solid" loading-auto @click="onSubmit" />
      </div>
    </template>
  </UModal>
</template>
