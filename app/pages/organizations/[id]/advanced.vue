<script setup lang="ts">
  const tabRef = ref<{ handleSave: () => Promise<void>; handleCancel: () => Promise<void>; isSaving: boolean } | null>(null)
  const isSaving = computed(() => tabRef.value?.isSaving ?? false)

  async function handleSave() {
    await tabRef.value?.handleSave()
  }

  function handleCancel() {
    tabRef.value?.handleCancel()
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <OrganizationAdvancedTab ref="tabRef" />

    <div class="border-default border-t pt-4">
      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler les changements"
          color="neutral"
          variant="outline"
          :disabled="isSaving"
          @click="handleCancel"
        />
        <UButton
          label="Enregistrer les modifications"
          icon="i-hugeicons-save"
          :loading="isSaving"
          :disabled="isSaving"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>
