<script setup lang="ts">
  import { createId } from '@paralleldrive/cuid2'

  // Two-way binding with parent
  const phoneNumbers = defineModel<PhoneNumber[] | null | undefined>({ required: true })
  const props = defineProps<{ error: string | null }>()

  // Single form state for both add and edit modes
  const form = reactive({
    id: '', // Empty means "add mode", filled means "edit mode"
    number: '',
    category: 'personal' as PhoneCategory
  })

  const isEditMode = computed(() => !!form.id)
  const canSubmit = computed(() => form.number.trim().length > 0)

  function resetForm() {
    form.id = ''
    form.number = ''
    form.category = 'personal'
  }

  function startEdit(phone: PhoneNumber) {
    form.id = phone.id
    form.number = phone.number
    form.category = phone.category
  }

  function submit() {
    if (!canSubmit.value || !phoneNumbers.value) return

    if (isEditMode.value) {
      // Update existing phone
      phoneNumbers.value = phoneNumbers.value.map((item) =>
        item.id === form.id ? { id: form.id, number: form.number.trim(), category: form.category } : item
      )
    } else {
      // Add new phone
      phoneNumbers.value.push({
        id: createId(),
        number: form.number.trim(),
        category: form.category
      })
    }

    resetForm()
  }

  function remove(id: string) {
    if (form.id === id) resetForm()

    if (!phoneNumbers.value) return

    const index = phoneNumbers.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      phoneNumbers.value.splice(index, 1) // Modifies the array in-place
    }
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Add/Edit Form -->
    <h4 class="mb-1 text-sm font-medium">Numéros de téléphone</h4>
    <div class="space-y-2">
      <div class="bg-muted border-accented grid grid-cols-1 gap-4 rounded-lg border border-dashed p-3 sm:grid-cols-2">
        <UFormField>
          <UInput
            v-model="form.number"
            placeholder="+1 (555) 123-4567"
            class="w-full"
            type="tel"
            @keyup.enter="submit"
            :ui="{ trailing: 'pe-1' }"
          >
            <template v-if="form.number?.length" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Effacer le champ"
                @click="form.number = ''"
              />
            </template>
          </UInput>
        </UFormField>
        <div class="flex w-full gap-4">
          <UFormField class="w-full">
            <USelectMenu
              v-model="form.category"
              :items="[...PHONE_CATEGORIES]"
              value-key="value"
              placeholder="Sélectionner une catégorie..."
              class="w-full"
            />
          </UFormField>
          <div class="flex gap-2">
            <UButton
              type="button"
              :icon="isEditMode ? 'i-lucide-save' : 'i-lucide-plus'"
              :label="isEditMode ? 'Confirmer' : 'Ajouter'"
              color="primary"
              variant="solid"
              block
              @click="submit"
              :disabled="!canSubmit"
            />
          </div>
        </div>
      </div>

      <!-- Phone List -->
      <template v-if="phoneNumbers?.length && phoneNumbers.length > 0">
        <ClientOnly>
          <template #fallback>
            <USkeleton
              v-for="item in [1, 2]"
              :key="item"
              class="bg-muted flex h-13 items-center justify-between rounded-lg"
            />
          </template>
          <div
            v-for="phone in phoneNumbers"
            :key="phone.id"
            class="flex items-center justify-between rounded-lg p-3"
            :class="isEditMode && form.id === phone.id ? 'hidden' : 'bg-muted'"
          >
            <div class="flex items-center gap-5">
              <p class="text-highlighted text-sm font-medium tabular-nums">{{ phone.number }}</p>
              <UBadge variant="subtle" color="neutral" class="rounded-full">
                {{ getPhoneCategoryLabel(phone.category) }}
              </UBadge>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-edit-2"
                variant="ghost"
                color="neutral"
                size="sm"
                square
                @click="startEdit(phone)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="sm"
                square
                @click="remove(phone.id)"
              />
            </div>
          </div>
        </ClientOnly>
      </template>
    </div>
    <UAlert v-if="props.error" color="error" variant="subtle" title="Attention !" icon="i-lucide-info">
      <template #description>
        <p class="whitespace-pre-line">
          {{ props.error }}
        </p>
      </template>
    </UAlert>
  </div>
</template>
