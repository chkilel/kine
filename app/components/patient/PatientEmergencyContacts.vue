<script setup lang="ts">
  const emergencyContacts = defineModel<EmergencyContact[] | null>()

  const contactState = reactive({
    editingIndex: null as number | null,
    name: '',
    number: '',
    relationship: undefined as Relationship | undefined,
    isAdding: false
  })

  const isEditingContact = computed(() => contactState.editingIndex !== null)
  const contactButtonLabel = computed(() =>
    isEditingContact.value ? 'Mettre à jour le contact' : 'Ajouter le contact'
  )

  function addOrUpdateContact() {
    if (!contactState.number.trim()) return

    if (!emergencyContacts.value) emergencyContacts.value = []

    const contactData = {
      name: contactState.name.trim() || undefined,
      number: contactState.number.trim(),
      relationship: contactState.relationship || undefined
    }

    if (contactState.editingIndex !== null) {
      emergencyContacts.value[contactState.editingIndex] = contactData
    } else {
      emergencyContacts.value.push(contactData)
    }

    resetContactForm()
  }

  function startEditContact(index: number) {
    const contact = emergencyContacts.value?.[index]
    if (!contact) return

    contactState.editingIndex = index
    contactState.name = contact.name || ''
    contactState.number = contact.number
    contactState.relationship = contact.relationship
    contactState.isAdding = true
  }

  function removeContact(index: number) {
    emergencyContacts.value?.splice(index, 1)
  }

  function resetContactForm() {
    contactState.editingIndex = null
    contactState.name = ''
    contactState.number = ''
    contactState.relationship = undefined
    contactState.isAdding = false
  }
</script>

<template>
  <div class="space-y-4">
    <div v-if="emergencyContacts?.length" class="divide-default divide-y">
      <div v-for="(contact, index) in emergencyContacts" :key="`contact-${index}`" class="py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UBadge icon="i-hugeicons-user" color="primary" variant="soft" size="lg" square />
            <div>
              <p class="font-semibold">{{ contact.name || 'Contact sans nom' }}</p>
              <p class="text-muted flex gap-4 text-xs">
                <span class="flex items-center gap-1">
                  <UIcon name="i-hugeicons-call-02" class="h-3 w-3" />
                  {{ contact.number }}
                </span>
                <span v-if="contact.relationship" class="ml-2 flex items-center gap-1">
                  <UIcon name="i-hugeicons-user-group" class="h-3 w-3" />
                  {{ getRelationshipLabel(contact.relationship) }}
                </span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-hugeicons-edit-04"
              variant="ghost"
              color="neutral"
              size="sm"
              square
              @click="startEditContact(index)"
            />
            <UButton
              icon="i-hugeicons-delete-02"
              variant="ghost"
              color="error"
              size="sm"
              square
              @click="removeContact(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="contactState.isAdding" class="space-y-4 rounded-lg border p-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">
          {{ isEditingContact ? 'Modifier le contact' : 'Ajouter un contact' }}
        </h4>
        <UButton
          icon="i-hugeicons-cancel-01"
          variant="ghost"
          color="neutral"
          size="sm"
          square
          @click="resetContactForm"
        />
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UFormField label="Nom du contact">
          <UInput v-model="contactState.name" placeholder="Jeanne Dupont" class="w-full" />
        </UFormField>
        <UFormField label="Téléphone du contact">
          <UInput v-model="contactState.number" placeholder="+1 (555) 987-6543" class="w-full" type="tel" />
        </UFormField>
        <UFormField label="Relation" class="md:col-span-2">
          <USelectMenu
            v-model="contactState.relationship"
            :items="RELATIONSHIP_OPTIONS"
            value-key="value"
            placeholder="Sélectionner une relation..."
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="flex gap-2">
        <UButton
          :label="contactButtonLabel"
          color="primary"
          variant="subtle"
          size="sm"
          :disabled="!contactState.number"
          @click="addOrUpdateContact"
        />
        <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="resetContactForm" />
      </div>
    </div>

    <UEmpty
      v-if="!emergencyContacts?.length && !contactState.isAdding"
      variant="naked"
      icon="i-hugeicons-identity-card"
      title="Aucun contact d'urgence ajouté"
      description="Il semble que vous n'ayez ajouté aucun contact. Ajoutez-en un pour commencer."
      :actions="[
        {
          icon: 'i-hugeicons-add-01',
          label: 'Ajouter un contact',
          variant: 'subtle',
          onClick(event) {
            event.stopPropagation()
            contactState.isAdding = true
          }
        }
      ]"
    />

    <UButton
      v-if="emergencyContacts?.length && !contactState.isAdding"
      icon="i-hugeicons-add-01"
      label="Ajouter un autre contact"
      color="primary"
      variant="outline"
      size="sm"
      @click="contactState.isAdding = true"
    />
  </div>
</template>
