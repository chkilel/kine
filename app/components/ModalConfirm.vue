<script setup lang="ts">
  const {
    title = 'Confirmer',
    message = 'Êtes-vous sûr de vouloir continuer ?',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    confirmColor = 'primary',
    icon = 'i-carbon-warning-alt'
  } = defineProps<{
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    confirmColor?: UIColor
    icon?: string
  }>()

  const emit = defineEmits<{
    close: [confirmed: boolean]
  }>()

  function handleConfirm() {
    emit('close', true)
  }

  function handleCancel() {
    emit('close', false)
  }
</script>

<template>
  <UModal :ui="{ header: 'hidden' }">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-4">
          <div
            :class="confirmColor === 'error' ? 'bg-error-10 text-error' : 'bg-warning-10 text-warning'"
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <UIcon :name="icon" class="size-8" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-bold">{{ title }}</h3>
            <p class="text-muted mt-1 text-sm">{{ message }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="outline" color="neutral" @click="handleCancel">
            {{ cancelText }}
          </UButton>
          <UButton :color="confirmColor" @click="handleConfirm">
            {{ confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
