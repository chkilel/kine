<script setup lang="ts">
  import { createId } from '@paralleldrive/cuid2'

  // Two-way binding with parent
  const phoneNumbers = defineModel<PhoneNumber[]>({ required: true })

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
    if (!canSubmit.value) return

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
    // If removing the phone being edited, reset form
    if (form.id === id) resetForm()

    phoneNumbers.value = phoneNumbers.value.filter((item) => item.id !== id)
  }
</script>

<template>
  <div class="space-y-4">
    <!-- Add/Edit Form -->
    <h4 class="mb-1 text-sm font-medium">Numéros de téléphone</h4>
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField>
          <UInput
            v-model="form.number"
            placeholder="+1 (555) 123-4567"
            class="w-full"
            type="tel"
            @keyup.enter="submit"
          />
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
              color="primary"
              variant="subtle"
              block
              @click="submit"
              :disabled="!canSubmit"
            />
            <UButton
              type="button"
              icon="i-lucide-x"
              color="error"
              block
              variant="soft"
              :disabled="!canSubmit"
              @click="resetForm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Phone List -->
    <ClientOnly>
      <div v-if="phoneNumbers.length > 0" class="space-y-2">
        <div
          v-for="phone in phoneNumbers"
          :key="phone.id"
          class="flex items-center justify-between rounded-lg p-3"
          :class="isEditMode && form.id === phone.id ? 'bg-primary/10 ring-primary ring' : 'bg-muted'"
        >
          <div class="flex items-center gap-5">
            <p class="text-highlighted text-sm font-medium">{{ phone.number }}</p>
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
            <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" square @click="remove(phone.id)" />
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>
