<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const toast = useToast()
  const formRef = ref<HTMLFormElement>()
  const requestFetch = useRequestFetch()
  const queryCache = useQueryCache()

  // Emergency contact form state
  const emergencyContactForm = reactive({
    name: '',
    phone: '',
    relationship: undefined as Relationship | undefined
  })

  // Edit state for emergency contacts
  const editingContactIndex = ref<number | null>(null)
  const editContactForm = reactive({
    name: '',
    phone: '',
    relationship: undefined as Relationship | undefined
  })

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
  const dobModel = computed<CalendarDate | null>({
    get: () => {
      if (!state.dateOfBirth) return null
      const date = new Date(state.dateOfBirth)
      return dateToCalendarDate(date)
    },
    set: (val) => {
      state.dateOfBirth = val ? val.toDate(getLocalTimeZone()) : undefined
    }
  })

  const updatePatientMutation = useMutation({
    mutation: () =>
      requestFetch(`/api/patients/${props.patient.id}`, {
        method: 'PUT',
        body: state
      }),
    onSuccess: () => {
      toast.add({
        title: 'Succès',
        description: `Patient ${state.firstName} ${state.lastName} mis à jour avec succès`,
        color: 'success'
      })

      queryCache.invalidateQueries({ key: ['patients'] })
      queryCache.invalidateQueries({ key: ['patient', props.patient.id] })

      emit('close')
    },
    onError: (error: any) => {
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la mise à jour du patient',
        color: 'error'
      })
    }
  })

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    updatePatientMutation.mutate()
  }

  function addNote() {
    const content = newNoteContent.value.trim()
    if (!content) return

    if (!state.notes) state.notes = []

    state.notes.push({
      date: new Date(),
      author: 'Current User', // TODO: Get from auth context
      content
    })

    newNoteContent.value = ''
  }

  function removeNote(index: number) {
    state.notes?.splice(index, 1)
  }

  function resetEmergencyContactForm() {
    emergencyContactForm.name = ''
    emergencyContactForm.phone = ''
    emergencyContactForm.relationship = undefined
  }

  function addEmergencyContact() {
    if (!emergencyContactForm.phone) return

    if (!state.emergencyContacts) state.emergencyContacts = []

    state.emergencyContacts.push({
      name: emergencyContactForm.name || undefined,
      phone: emergencyContactForm.phone,
      relationship: emergencyContactForm.relationship
    })

    resetEmergencyContactForm()
  }

  function startEditContact(index: number) {
    const contact = state.emergencyContacts?.[index]
    if (!contact) return

    editingContactIndex.value = index
    editContactForm.name = contact.name || ''
    editContactForm.phone = contact.phone
    editContactForm.relationship = contact.relationship
  }

  function saveEditContact() {
    if (editingContactIndex.value === null || !state.emergencyContacts) return

    state.emergencyContacts[editingContactIndex.value] = {
      name: editContactForm.name || undefined,
      phone: editContactForm.phone,
      relationship: editContactForm.relationship
    }

    cancelEditContact()
  }

  function cancelEditContact() {
    editingContactIndex.value = null
    editContactForm.name = ''
    editContactForm.phone = ''
    editContactForm.relationship = undefined
  }

  function removeEmergencyContact(index: number) {
    state.emergencyContacts?.splice(index, 1)
  }

  const isFormValid = computed(() => {
    return state.firstName && state.lastName
  })

  const canAddEmergencyContact = computed(() => {
    return emergencyContactForm.phone.trim().length > 0
  })

  const canSaveEditContact = computed(() => {
    return editContactForm.phone.trim().length > 0
  })
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
        <AppCard title="Informations de base" variant="outline">
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
        </AppCard>

        <!-- Address Information -->
        <AppCard variant="outline">
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
        </AppCard>

        <!-- Emergency Contact -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Contact d'urgence</h3>
          <div class="space-y-4">
            <div class="text-sm">Contacts existants: {{ state.emergencyContacts?.length || 0 }}</div>
            <div v-if="state.emergencyContacts?.length" class="divide-default divide-y">
              <div v-for="(contact, index) in state.emergencyContacts" :key="`contact-${index}`" class="py-3">
                <!-- Edit Form -->
                <div v-if="editingContactIndex === index" class="space-y-3">
                  <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <UFormField label="Nom du contact">
                      <UInput v-model="editContactForm.name" placeholder="Jeanne Dupont" class="w-full" />
                    </UFormField>
                    <UFormField label="Téléphone du contact">
                      <UInput
                        v-model="editContactForm.phone"
                        placeholder="+1 (555) 987-6543"
                        class="w-full"
                        type="tel"
                      />
                    </UFormField>
                    <UFormField label="Relation" class="md:col-span-2">
                      <USelectMenu
                        v-model="editContactForm.relationship"
                        :items="RELATIONSHIP_OPTIONS"
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
                      :disabled="!canSaveEditContact"
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
                      @click="removeEmergencyContact(index)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Add New Contact Form (hidden when editing) -->
            <div v-if="editingContactIndex === null" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UFormField label="Nom du contact">
                  <UInput v-model="emergencyContactForm.name" placeholder="Jeanne Dupont" class="w-full" />
                </UFormField>
                <UFormField label="Téléphone du contact">
                  <UInput
                    v-model="emergencyContactForm.phone"
                    placeholder="+1 (555) 987-6543"
                    class="w-full"
                    type="tel"
                  />
                </UFormField>
                <UFormField label="Relation" class="md:col-span-2">
                  <USelectMenu
                    v-model="emergencyContactForm.relationship"
                    :items="RELATIONSHIP_OPTIONS"
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
                :disabled="!canAddEmergencyContact"
              />
            </div>
          </div>
        </AppCard>

        <!-- Insurance Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations d'assurance</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Assureur" placeholder="Assureur" name="insuranceProvider">
              <UInput v-model="state.insuranceProvider" class="w-full" />
            </UFormField>
            <UFormField label="Numéro d'assurance" placeholder="123456789" name="insuranceNumber">
              <UInput v-model="state.insuranceNumber" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <!-- Referral Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations de recommandation</h3>
          <UFormField label="Source de recommandation" placeholder="Dr. Martin" name="referralSource">
            <UInput v-model="state.referralSource" class="w-full" />
          </UFormField>
        </AppCard>

        <!-- Notes -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Notes</h3>
          <div class="space-y-4">
            <div class="text-sm">Notes existantes: {{ state.notes?.length || 0 }}</div>
            <div v-if="state.notes?.length" class="space-y-2">
              <div
                v-for="(note, index) in state.notes"
                :key="`note-${index}`"
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
        </AppCard>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="emit('close')">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="h-9 px-3 text-sm font-semibold"
          type="submit"
          @click="onSubmit"
          :loading="updatePatientMutation.isLoading.value"
          :disabled="updatePatientMutation.isLoading.value || !isFormValid"
        >
          Mettre à jour
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
