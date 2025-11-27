<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { parseISO } from 'date-fns'

  const props = defineProps<{
    patient: Patient
  }>()

  const emit = defineEmits<{
    close: [patient?: Partial<Patient>]
  }>()

  const toast = useToast()
  const formRef = ref<HTMLFormElement>()

  // Emergency contact state
  const emergencyContactName = ref('')
  const emergencyContactPhone = ref('')
  const emergencyContactRelationship = ref('')

  // Edit state for emergency contacts
  const editingContactIndex = ref<number | null>(null)
  const editContactName = ref('')
  const editContactPhone = ref('')
  const editContactRelationship = ref('')

  // Notes state
  const newNoteContent = ref('')

  const state = reactive<PatientUpdate>({
    firstName: props.patient.firstName,
    lastName: props.patient.lastName,
    email: props.patient.email || undefined,
    phone: props.patient.phone || undefined,
    dateOfBirth: props.patient.dateOfBirth || undefined,
    gender: props.patient.gender || undefined,
    address: props.patient.address || undefined,
    city: props.patient.city || undefined,
    postalCode: props.patient.postalCode || undefined,
    country: props.patient.country || undefined,
    emergencyContacts: props.patient.emergencyContacts || [],
    insuranceProvider: props.patient.insuranceProvider || undefined,
    insuranceNumber: props.patient.insuranceNumber || undefined,
    referralSource: props.patient.referralSource || undefined,
    status: props.patient.status
  })

  // Date formatter and calendar models
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const dobModel = shallowRef<CalendarDate | null>(null)

  watch(dobModel, (val) => {
    state.dateOfBirth = val ? val.toDate(getLocalTimeZone()) : undefined
  })

  // Initialize calendar models with patient data
  onMounted(() => {
    if (props.patient.dateOfBirth) {
      const date = new Date(props.patient.dateOfBirth)
      dobModel.value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    }
  })

  async function onSubmit() {
    if (!formRef.value) return

    try {
      const validationResult = await formRef.value.validate()

      if (!validationResult) return

      const response = await $fetch(`/api/patients/${props.patient.id}`, {
        method: 'PUT',
        body: state
      })

      toast.add({
        title: 'Succès',
        description: `Patient ${state.firstName} ${state.lastName} mis à jour avec succès`,
        color: 'success'
      })

      // Refresh the patient data
      await refreshNuxtData(`user-${response.id}`)

      emit('close', {
        ...response,
        dateOfBirth: parseISO(response.dateOfBirth)
      })
    } catch (error: any) {
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la mise à jour du patient',
        color: 'error'
      })
    }
  }

  function addNote() {
    if (!newNoteContent.value.trim()) return

    const note = {
      date: new Date(),
      author: 'Current User', // TODO: Get from auth context
      content: newNoteContent.value.trim()
    }

    if (!state.notes) {
      state.notes = []
    }

    state.notes.push(note)
    newNoteContent.value = ''
  }

  function removeNote(index: number) {
    state.notes?.splice(index, 1)
  }

  function addEmergencyContact() {
    if (!emergencyContactPhone.value) return

    const newContact = {
      name: emergencyContactName.value || undefined,
      phone: emergencyContactPhone.value,
      relationship: emergencyContactRelationship.value || undefined
    }

    if (!state.emergencyContacts) {
      state.emergencyContacts = []
    }

    state.emergencyContacts.push(newContact)

    // Reset form
    emergencyContactName.value = ''
    emergencyContactPhone.value = ''
    emergencyContactRelationship.value = ''
  }

  function startEditContact(index: number) {
    const contact = state.emergencyContacts?.[index]
    if (!contact) return

    editingContactIndex.value = index
    editContactName.value = contact.name || ''
    editContactPhone.value = contact.phone
    editContactRelationship.value = contact.relationship || ''
  }

  function saveEditContact() {
    if (editingContactIndex.value === null || !state.emergencyContacts) return

    state.emergencyContacts[editingContactIndex.value] = {
      name: editContactName.value || undefined,
      phone: editContactPhone.value,
      relationship: editContactRelationship.value || undefined
    }

    cancelEditContact()
  }

  function cancelEditContact() {
    editingContactIndex.value = null
    editContactName.value = ''
    editContactPhone.value = ''
    editContactRelationship.value = ''
  }

  function handleCancel() {
    emit('close')
  }
</script>

<template>
  <USlideover
    :open="true"
    :dismissible="false"
    @close="emit('close')"
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="state" class="space-y-6">
        <!-- Basic Information -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations de base</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Prénom" placeholder="Jean" name="firstName">
              <UInput v-model="state.firstName" class="w-full" />
            </UFormField>
            <UFormField label="Nom" placeholder="Dupont" name="lastName">
              <UInput v-model="state.lastName" class="w-full" />
            </UFormField>
            <UFormField label="E‑mail" placeholder="john.doe@example.com" name="email">
              <UInput v-model="state.email" class="w-full" type="email" />
            </UFormField>
            <UFormField label="Téléphone" placeholder="+1 (555) 123-4567" name="phone">
              <UInput v-model="state.phone" class="w-full" type="tel" />
            </UFormField>
            <UFormField label="Date de naissance" name="dateOfBirth">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start" block>
                  {{ dobModel ? df.format(dobModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                </UButton>
                <template #content>
                  <UCalendar v-model="dobModel" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
            <UFormField label="Sexe" name="gender">
              <USelect
                v-model="state.gender"
                class="w-full"
                :items="[
                  { label: 'Homme', value: 'male' },
                  { label: 'Femme', value: 'female' }
                ]"
              />
            </UFormField>
            <UFormField label="Statut" name="status" class="md:col-span-2">
              <URadioGroup
                orientation="horizontal"
                variant="table"
                v-model="state.status"
                :items="PATIENT_STATUS_OPTIONS"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Address Information -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Adresse</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Adresse" placeholder="123 rue Principale" name="address" class="md:col-span-2">
              <UInput v-model="state.address" class="w-full" />
            </UFormField>
            <UFormField label="Ville" placeholder="Paris" name="city">
              <UInput v-model="state.city" class="w-full" />
            </UFormField>
            <UFormField label="Code postal" placeholder="10001" name="postalCode">
              <UInput v-model="state.postalCode" class="w-full" />
            </UFormField>
            <UFormField label="Pays" placeholder="France" name="country" class="md:col-span-2">
              <UInput v-model="state.country" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Emergency Contact -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Contact d'urgence</h3>
          <div class="space-y-4">
            <div class="text-sm">Contacts existants: {{ state.emergencyContacts?.length || 0 }}</div>
            <div v-if="state.emergencyContacts?.length" class="divide-default divide-y">
              <div v-for="(contact, index) in state.emergencyContacts" :key="`contact-${index}`" class="py-3">
                <!-- Edit Form -->
                <div v-if="editingContactIndex === index" class="space-y-3">
                  <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <UFormField label="Nom du contact">
                      <UInput v-model="editContactName" placeholder="Jeanne Dupont" class="w-full" />
                    </UFormField>
                    <UFormField label="Téléphone du contact">
                      <UInput v-model="editContactPhone" placeholder="+1 (555) 987-6543" class="w-full" type="tel" />
                    </UFormField>
                    <UFormField label="Relation" class="md:col-span-2">
                      <USelectMenu
                        v-model="editContactRelationship"
                        :items="RELATIONSHIPS"
                        value-key="value"
                        placeholder="Sélectionner une relation..."
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      label="Enregistrer"
                      color="primary"
                      variant="subtle"
                      size="sm"
                      @click="saveEditContact"
                      :disabled="!editContactPhone"
                    />
                    <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="cancelEditContact" />
                  </div>
                </div>

                <!-- Display View -->
                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <UBadge icon="i-lucide-user" color="primary" variant="soft" size="lg" square />
                    <div>
                      <p class="font-semibold">{{ contact.name || 'Contact sans nom' }}</p>
                      <p class="text-muted flex gap-4 text-xs">
                        <span class="flex items-center gap-1">
                          <UIcon name="i-lucide-phone" class="h-3 w-3" />
                          {{ contact.phone }}
                        </span>
                        <span v-if="contact.relationship" class="ml-2 flex items-center gap-1">
                          <UIcon name="i-lucide-users" class="h-3 w-3" />
                          {{ getRelationshipLabel(contact.relationship) }}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <UButton
                      icon="i-lucide-edit-2"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      square
                      @click="startEditContact(index)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      variant="ghost"
                      color="error"
                      size="sm"
                      square
                      @click="state.emergencyContacts?.splice(index, 1)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Add New Contact Form (hidden when editing) -->
            <div v-if="editingContactIndex === null" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UFormField label="Nom du contact">
                  <UInput v-model="emergencyContactName" placeholder="Jeanne Dupont" class="w-full" />
                </UFormField>
                <UFormField label="Téléphone du contact">
                  <UInput v-model="emergencyContactPhone" placeholder="+1 (555) 987-6543" class="w-full" type="tel" />
                </UFormField>
                <UFormField label="Relation" class="md:col-span-2">
                  <USelectMenu
                    v-model="emergencyContactRelationship"
                    :items="RELATIONSHIPS"
                    value-key="value"
                    placeholder="Sélectionner une relation..."
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UButton
                label="Ajouter le contact"
                color="primary"
                variant="subtle"
                size="sm"
                @click="addEmergencyContact"
                :disabled="!emergencyContactPhone"
              />
            </div>
          </div>
        </UCard>

        <!-- Insurance Information -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations d'assurance</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Assureur" placeholder="Assureur" name="insuranceProvider">
              <UInput v-model="state.insuranceProvider" class="w-full" />
            </UFormField>
            <UFormField label="Numéro d'assurance" placeholder="123456789" name="insuranceNumber">
              <UInput v-model="state.insuranceNumber" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Referral Information -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations de recommandation</h3>
          <UFormField label="Source de recommandation" placeholder="Dr. Martin" name="referralSource">
            <UInput v-model="state.referralSource" class="w-full" />
          </UFormField>
        </UCard>

        <!-- Notes -->
        <UCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Notes</h3>
          <div class="space-y-4">
            <div class="text-sm">Notes existantes: {{ state.notes?.length || 0 }}</div>
            <div v-if="state.notes && state.notes.length > 0" class="space-y-2">
              <div
                v-for="(note, index) in state.notes"
                :key="index"
                class="flex items-start justify-between rounded-lg p-3"
              >
                <div class="flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-sm font-medium">{{ note.author }}</span>
                    <span class="text-xs">{{ new Date(note.date).toLocaleDateString('fr-FR') }}</span>
                  </div>
                  <div class="text-sm">{{ note.content }}</div>
                </div>
                <UButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" @click="removeNote(index)" />
              </div>
            </div>
            <div class="flex gap-2">
              <UTextarea v-model="newNoteContent" placeholder="Ajouter une note..." :rows="2" class="flex-1" />
              <UButton
                label="Ajouter"
                color="primary"
                variant="solid"
                @click="addNote"
                :disabled="!newNoteContent.trim()"
              />
            </div>
          </div>
        </UCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="handleCancel">
          Annuler
        </UButton>
        <UButton color="primary" class="h-9 px-3 text-sm font-semibold" type="submit" @click="onSubmit">
          Mettre à jour
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
