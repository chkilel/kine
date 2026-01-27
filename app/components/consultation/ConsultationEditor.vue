<script setup lang="ts">
  import { useConsultationAction } from '~/composables/useConsultationAction'

  const props = defineProps<{
    modelValue: string
    selectedTags: string[]
    consultationId: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    'update:selectedTags': [value: string[]]
  }>()

  const consultationAction = useConsultationAction()

  const AVAILABLE_TAGS = [
    'Douleur Diminuée',
    'Gain Amplitude',
    'Proprioception',
    'Cryothérapie',
    'Renforcement'
  ] as const

  async function toggleTag(tag: string) {
    const previousTags = [...props.selectedTags]
    const newTags = props.selectedTags.includes(tag)
      ? props.selectedTags.filter((t) => t !== tag)
      : [...props.selectedTags, tag]

    emit('update:selectedTags', newTags)

    try {
      await consultationAction.updateTagsAsync({
        id: props.consultationId,
        tags: newTags
      })
    } catch (error) {
      console.error('Failed to save tags:', error)
      emit('update:selectedTags', previousTags)
    }
  }
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 flex flex-col space-y-2 overflow-hidden' }">
    <div class="border-default bg-muted-50 flex items-center gap-1 border-b p-2">
      <UButton icon="i-hugeicons-text-bold" variant="ghost" color="neutral" size="xs" square />
      <UButton icon="i-hugeicons-text-italic" variant="ghost" color="neutral" size="xs" square />
      <UButton icon="i-hugeicons-text-underline" variant="ghost" color="neutral" size="xs" square />
      <div class="bg-border mx-2 h-6 w-px" />
      <UButton icon="i-hugeicons-check-list" variant="ghost" color="neutral" size="xs" square />
      <UButton icon="i-hugeicons-left-to-right-list-number" variant="ghost" color="neutral" size="xs" square />
      <div class="flex-1" />
      <div class="text-muted flex items-center gap-1 text-xs">
        <UIcon name="i-hugeicons-cloud-saving-done-01" class="size-4" />
        Sauvegardé
      </div>
    </div>

    <UTextarea
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      :rows="12"
      placeholder="Notes de la séance... Décrivez les exercices effectués, les réactions du patient et les progrès observés."
      class="border-none bg-transparent focus:ring-0"
      :ui="{ root: 'flex-1 h-full' }"
    />

    <div class="border-default bg-muted-50/50 dark:bg-muted-900/30 border-t p-4">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-muted text-xs font-bold tracking-wider uppercase">Smart Tags</p>
        <UButton variant="ghost" color="primary" size="xs">Gérer les tags</UButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="tag in AVAILABLE_TAGS"
          :key="tag"
          :icon="selectedTags.includes(tag) ? 'i-hugeicons-checkmark-circle-01' : 'i-hugeicons-add-01'"
          :variant="selectedTags.includes(tag) ? 'solid' : 'outline'"
          :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
          size="xs"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
