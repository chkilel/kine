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
        title: 'Error',
        description: 'No patients selected for deletion',
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
        title: 'Success',
        description: `${props.selectedIds.length} patient${props.selectedIds.length > 1 ? 's' : ''} deleted successfully`,
        color: 'success'
      })

      open.value = false

      // Refresh the patient list
      await refreshNuxtData()
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || 'Failed to delete patients',
        color: 'error'
      })
    }
  }
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count} patient${count > 1 ? 's' : ''}`"
    :description="`Are you sure? This action cannot be undone and will remove all patient records.`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Delete" color="error" variant="solid" loading-auto @click="onSubmit" />
      </div>
    </template>
  </UModal>
</template>
