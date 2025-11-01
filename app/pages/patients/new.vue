<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const toast = useToast()
  const router = useRouter()

  const state = reactive<Partial<PatientCreate>>({
    firstName: '',
    lastName: '',
    email: undefined,
    phone: '',
    dateOfBirth: undefined,
    gender: undefined,
    address: undefined,
    city: undefined,
    postalCode: undefined,
    country: undefined,
    emergencyContacts: [],
    medicalConditions: [],
    surgeries: [],
    allergies: [],
    medications: [],
    insuranceProvider: undefined,
    insuranceNumber: undefined,
    referralSource: undefined,
    referralDate: undefined,
    status: 'active',
    notes: undefined
  })

  const form = useTemplateRef<HTMLFormElement>('createPatientForm')

  // Array input fields
  const newMedicalCondition = ref('')
  const newSurgery = ref('')
  const newAllergy = ref('')
  const newMedication = ref('')

  // Date formatter and calendar models
  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const dobModel = shallowRef<CalendarDate | null>(null)
  const referralModel = shallowRef<CalendarDate | null>(null)

  watch(dobModel, (val) => {
    state.dateOfBirth = val ? val.toDate(getLocalTimeZone()) : undefined
  })
  watch(referralModel, (val) => {
    state.referralDate = val ? val.toDate(getLocalTimeZone()) : undefined
  })

  async function onSubmit(event: FormSubmitEvent<PatientCreate>) {
    try {
      // Prepare the data to match the database schema
      const submitData = {
        ...event.data,
        // Filter out empty values from arrays
        medicalConditions: event.data.medicalConditions?.filter((condition) => condition.trim() !== '') || [],
        surgeries: event.data.surgeries?.filter((surgery) => surgery.trim() !== '') || [],
        allergies: event.data.allergies?.filter((allergy) => allergy.trim() !== '') || [],
        medications: event.data.medications?.filter((medication) => medication.trim() !== '') || [],
        // Filter out empty emergency contacts numbers, name and relationship are optional
        emergencyContacts: event.data.emergencyContacts?.filter((contact) => contact.phone.trim() !== '') || []
      }

      const response = await $fetch('/api/patients', {
        method: 'POST',
        body: submitData
      })

      toast.add({
        title: 'Succès',
        description: `Nouveau patient ${event.data.firstName} ${event.data.lastName} ajouté`,
        color: 'success'
      })

      // Redirect to patient list or detail page
      await router.push('/patients')
    } catch (error: any) {
      toast.add({
        title: 'Erreur',
        description: error.data?.statusMessage || 'Échec de la création du patient',
        color: 'error'
      })
    }
  }

  // Accordion items for collapsible sections
  const accordionItems = [
    {
      label: 'Antécédents médicaux',
      icon: 'i-lucide-history',
      slot: 'medical-history'
    },
    {
      label: 'Assurance & Facturation',
      icon: 'i-lucide-file-text',
      slot: 'insurance-billing'
    },
    {
      label: 'Pièces jointes',
      icon: 'i-lucide-paperclip',
      slot: 'attachments'
    },
    {
      label: 'Notes',
      icon: 'i-lucide-clipboard-list',
      slot: 'notes'
    }
  ]

  // Array management functions
  function addEmergencyContact() {
    if (!state.emergencyContacts) {
      state.emergencyContacts = []
    }
    state.emergencyContacts.push({ name: '', phone: '', relationship: '' })
  }

  function removeEmergencyContact(index: number) {
    state.emergencyContacts?.splice(index, 1)
  }

  function addArrayItem(arrayField: keyof PatientCreate, value: string) {
    const currentArray = (state[arrayField] as string[]) || []
    if (value.trim()) {
      currentArray.push(value.trim())
      const updatedState = state as any
      updatedState[arrayField] = currentArray
    }
  }

  function removeArrayItem(arrayField: keyof PatientCreate, index: number) {
    const currentArray = (state[arrayField] as string[]) || []
    currentArray.splice(index, 1)
    const updatedState = state as any
    updatedState[arrayField] = currentArray
  }

  function addMedicalCondition() {
    addArrayItem('medicalConditions', newMedicalCondition.value)
    newMedicalCondition.value = ''
  }

  function addSurgery() {
    addArrayItem('surgeries', newSurgery.value)
    newSurgery.value = ''
  }

  function addAllergy() {
    addArrayItem('allergies', newAllergy.value)
    newAllergy.value = ''
  }

  function addMedication() {
    addArrayItem('medications', newMedication.value)
    newMedication.value = ''
  }

  // File upload handling
  const uploadedFiles = ref<File[]>([])

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files) {
      uploadedFiles.value = Array.from(target.files)
    }
  }

  function removeFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function updateArrayItem(arrayField: keyof PatientCreate, index: number, value: string) {
    const currentArray = (state[arrayField] as string[]) || []
    currentArray[index] = value
    ;(state as any)[arrayField] = currentArray
  }

  function submitButton() {
    form.value?.submit()
  }
</script>

<template>
  <UDashboardPanel id="new-patient" class="bg-elevated">
    <template #header>
      <UDashboardNavbar title="Nouveau patient">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="$router.back()">Retour</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <h1 class="text-xl font-semibold">Nouvelle fiche patient</h1>
        <p class="text-toned text-sm">
          Remplissez les informations ci-dessous pour ajouter un nouveau patient à votre cabinet.
        </p>
      </div>

      <UForm ref="createPatientForm" :schema="patientCreateSchema" :state="state" @submit="onSubmit">
        <!-- Single Column Layout matching the reference design -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Basic Information Section -->
          <UCard>
            <template #header>
              <h2 class="mb-4 text-lg font-medium">Informations de base</h2>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField label="Prénom" name="firstName" required>
                  <UInput v-model="state.firstName" placeholder="Jean" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="lastName" required>
                  <UInput v-model="state.lastName" placeholder="Dupont" class="w-full" />
                </UFormField>
                <UFormField label="Date de naissance" name="dateOfBirth" required>
                  <UPopover>
                    <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full justify-start">
                      {{ dobModel ? df.format(dobModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="dobModel" class="p-2" />
                    </template>
                  </UPopover>
                </UFormField>
                <UFormField label="Genre" name="gender" required>
                  <USelect
                    v-model="state.gender"
                    class="w-full"
                    placeholder="Sélectionner..."
                    :items="[
                      { label: 'Homme', value: 'male' },
                      { label: 'Femme', value: 'female' }
                    ]"
                  />
                </UFormField>
                <UFormField label="Email" name="email">
                  <UInput v-model="state.email" placeholder="jean.dupont@email.com" type="email" class="w-full" />
                </UFormField>
                <UFormField label="Téléphone" name="phone">
                  <UInput v-model="state.phone" placeholder="06 12 34 56 78" type="tel" class="w-full" />
                </UFormField>
              </div>
            </template>
          </UCard>

          <!-- Contact Information Section -->
          <UCard>
            <template #header>
              <h2 class="mb-4 text-lg font-medium">Coordonnées</h2>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField label="Adresse" name="address" class="sm:col-span-2 lg:col-span-3">
                  <UInput v-model="state.address" placeholder="123 Rue de la Santé" class="w-full" />
                </UFormField>
                <UFormField label="Ville" name="city">
                  <UInput v-model="state.city" placeholder="Paris" class="w-full" />
                </UFormField>
                <UFormField label="Code Postal" name="postalCode">
                  <UInput v-model="state.postalCode" placeholder="75001" class="w-full" />
                </UFormField>
                <UFormField label="Pays" name="country">
                  <UInput v-model="state.country" placeholder="France" class="w-full" />
                </UFormField>
              </div>
            </template>

            <!-- Emergency Contact Section -->
            <template #footer>
              <div class="mt-2 space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium">Contacts d'urgence</h3>
                  <UButton size="xs" color="primary" variant="soft" @click="addEmergencyContact">
                    <UIcon name="i-lucide-plus" class="mr-1" />
                    Ajouter
                  </UButton>
                </div>

                <div v-if="state.emergencyContacts && state.emergencyContacts.length > 0" class="space-y-3">
                  <div v-for="(contact, index) in state.emergencyContacts" :key="index" class="rounded-lg border p-3">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <UFormField :label="`Nom ${index + 1}`" :name="`emergencyContacts.${index}.name`">
                        <UInput v-model="contact.name" placeholder="Nom du contact" />
                      </UFormField>
                      <UFormField :label="`Téléphone ${index + 1}`" :name="`emergencyContacts.${index}.phone`">
                        <UInput v-model="contact.phone" placeholder="06 12 34 56 78" type="tel" />
                      </UFormField>
                      <div class="flex items-end gap-2">
                        <UFormField
                          :label="`Relation ${index + 1}`"
                          :name="`emergencyContacts.${index}.relationship`"
                          class="flex-1"
                        >
                          <UInput v-model="contact.relationship" placeholder="Épouse, Mère..." />
                        </UFormField>
                        <UButton size="xs" color="error" variant="ghost" @click="removeEmergencyContact(index)">
                          <UIcon name="i-lucide-trash-2" />
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="py-4 text-center text-sm text-gray-500">Aucun contact d'urgence ajouté</div>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Collapsible Sections -->
        <div class="space-y-3 pt-4">
          <UAccordion
            :items="accordionItems"
            type="single"
            class="mb-6"
            :ui="{
              root: 'space-y-2',
              item: 'rounded-lg bg-default ring ring-default',
              trigger: 'px-4 sm:px-6',
              leadingIcon: 'text-primary',
              content: 'border-t border-default'
            }"
          >
            <!-- Medical History -->
            <template #medical-history>
              <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <!-- Medical Conditions -->
                <UFormField label="Conditions médicales" name="medicalConditions">
                  <div class="space-y-2">
                    <div
                      v-if="state.medicalConditions && state.medicalConditions.length > 0"
                      class="flex flex-wrap gap-2"
                    >
                      <UBadge v-for="(condition, index) in state.medicalConditions" :key="index" class="rounded-full">
                        {{ condition }}

                        <template #trailing>
                          <UButton
                            icon="i-lucide-x"
                            size="xs"
                            color="neutral"
                            variant="subtle"
                            class="rounded-full"
                            @click="removeArrayItem('medicalConditions', index)"
                          />
                        </template>
                      </UBadge>
                    </div>
                    <div class="flex gap-2">
                      <UInput
                        v-model="newMedicalCondition"
                        placeholder="Ajouter une condition"
                        @keyup.enter="addMedicalCondition"
                        class="flex-1"
                      />
                      <UButton size="sm" @click="addMedicalCondition">
                        <UIcon name="i-lucide-plus" />
                      </UButton>
                    </div>
                  </div>
                </UFormField>

                <!-- Surgeries -->
                <UFormField label="Chirurgies" name="surgeries">
                  <div class="space-y-2">
                    <div v-if="state.surgeries && state.surgeries.length > 0" class="flex flex-wrap gap-2">
                      <span
                        v-for="(surgery, index) in state.surgeries"
                        :key="index"
                        class="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                      >
                        {{ surgery }}
                        <button
                          type="button"
                          @click="removeArrayItem('surgeries', index)"
                          class="hover:text-primary-600"
                        >
                          <UIcon name="i-lucide-x" class="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <UInput
                        v-model="newSurgery"
                        placeholder="Ajouter une chirurgie"
                        @keyup.enter="addSurgery"
                        class="flex-1"
                      />
                      <UButton size="sm" @click="addSurgery">
                        <UIcon name="i-lucide-plus" />
                      </UButton>
                    </div>
                  </div>
                </UFormField>

                <!-- Allergies -->
                <UFormField label="Allergies" name="allergies">
                  <div class="space-y-2">
                    <div v-if="state.allergies && state.allergies.length > 0" class="flex flex-wrap gap-2">
                      <span
                        v-for="(allergy, index) in state.allergies"
                        :key="index"
                        class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-900 dark:text-red-200"
                      >
                        {{ allergy }}
                        <button type="button" @click="removeArrayItem('allergies', index)" class="hover:text-red-600">
                          <UIcon name="i-lucide-x" class="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <UInput
                        v-model="newAllergy"
                        placeholder="Ajouter une allergie"
                        @keyup.enter="addAllergy"
                        class="flex-1"
                      />
                      <UButton size="sm" @click="addAllergy">
                        <UIcon name="i-lucide-plus" />
                      </UButton>
                    </div>
                  </div>
                </UFormField>

                <!-- Medications -->
                <UFormField label="Médicaments" name="medications">
                  <div class="space-y-2">
                    <div v-if="state.medications && state.medications.length > 0" class="flex flex-wrap gap-2">
                      <span
                        v-for="(medication, index) in state.medications"
                        :key="index"
                        class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {{ medication }}
                        <button
                          type="button"
                          @click="removeArrayItem('medications', index)"
                          class="hover:text-blue-600"
                        >
                          <UIcon name="i-lucide-x" class="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <UInput
                        v-model="newMedication"
                        placeholder="Ajouter un médicament"
                        @keyup.enter="addMedication"
                        class="flex-1"
                      />
                      <UButton size="sm" @click="addMedication">
                        <UIcon name="i-lucide-plus" />
                      </UButton>
                    </div>
                  </div>
                </UFormField>
              </div>
            </template>

            <!-- Insurance & Billing -->
            <template #insurance-billing>
              <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <UFormField label="Assureur" name="insuranceProvider">
                  <UInput v-model="state.insuranceProvider" placeholder="Nom de l'assureur" />
                </UFormField>
                <UFormField label="Numéro d'assurance" name="insuranceNumber">
                  <UInput v-model="state.insuranceNumber" placeholder="Numéro de police" />
                </UFormField>
                <UFormField label="Source de recommandation" name="referralSource">
                  <UInput v-model="state.referralSource" placeholder="Médecin traitant, etc." />
                </UFormField>
                <UFormField label="Date de recommandation" name="referralDate">
                  <UPopover>
                    <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full justify-start">
                      {{
                        referralModel ? df.format(referralModel.toDate(getLocalTimeZone())) : 'Sélectionner une date'
                      }}
                    </UButton>
                    <template #content>
                      <UCalendar v-model="referralModel" class="p-2" />
                    </template>
                  </UPopover>
                </UFormField>
              </div>
            </template>

            <!-- Attachments -->
            <template #attachments>
              <div class="p-6">
                <UFormField name="attachments">
                  <div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                    <UIcon
                      name="i-lucide-cloud-upload"
                      class="mx-auto mb-4 text-4xl text-gray-500 dark:text-gray-400"
                    />
                    <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
                      <span class="font-semibold">Cliquez pour téléverser</span>
                      ou glissez-déposez
                    </p>
                    <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
                      Ordonnance, imagerie, etc. (PDF, JPG, PNG)
                    </p>
                    <UInput type="file" multiple accept=".pdf,.jpg,.jpeg,.png" @change="handleFileUpload" />
                  </div>

                  <!-- Display uploaded files -->
                  <div v-if="uploadedFiles.length > 0" class="mt-4 space-y-2">
                    <div
                      v-for="(file, index) in uploadedFiles"
                      :key="index"
                      class="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800"
                    >
                      <span class="text-sm">{{ file.name }}</span>
                      <UButton size="xs" color="error" variant="ghost" @click="removeFile(index)">
                        <UIcon name="i-lucide-x" />
                      </UButton>
                    </div>
                  </div>
                </UFormField>
              </div>
            </template>

            <!-- Notes -->
            <template #notes>
              <div class="p-6">
                <UFormField label="Notes" name="notes">
                  <UTextarea v-model="state.notes" placeholder="Notes libres sur le patient..." :rows="5" />
                </UFormField>
              </div>
            </template>
          </UAccordion>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-end space-x-4">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="router.push('/patients')" />

          <UFieldGroup>
            <UButton @click="submitButton" color="primary" variant="subtle" label="Enregistrer" />
            <UDropdownMenu
              :items="[
                [
                  {
                    label: 'Enregistrer & Planifier RDV',
                    icon: 'i-lucide-calendar-plus',
                    disabled: true
                  }
                ]
              ]"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                color="primary"
                class="border-primary-500 rounded-l-none border-l"
                trailing-icon="i-lucide-chevron-down"
              />
            </UDropdownMenu>
          </UFieldGroup>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
