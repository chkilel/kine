<script setup lang="ts">
  import type { BreadcrumbItem, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
  import { getLocalTimeZone, parseDate } from '@internationalized/date'
  import { format } from 'date-fns'
  import { fr } from 'date-fns/locale'

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: 'Nouvelle fiche patient' }
  ] as Array<BreadcrumbItem>

  const { activeOrganization } = useOrganization()
  const { useCreatePatient } = usePatient()

  const formRef = useTemplateRef<HTMLFormElement>('createPatientForm')
  const formState = reactive<PatientCreate>({
    organizationId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    status: 'active',
    medicalConditions: [],
    surgeries: [],
    allergies: [],
    medications: [],
    emergencyContacts: [],
    notes: []
  })

  watchEffect(() => {
    if (activeOrganization.value.data?.id) {
      formState.organizationId = activeOrganization.value.data.id
    }
  })

  // Array input fields - consolidated
  const arrayInputs = reactive({
    medicalCondition: '',
    surgery: '',
    allergy: '',
    medication: '',
    note: ''
  })

  const patientNotes = ref<Array<Note>>([])

  // Emergency contact state - consolidated
  const contactState = reactive({
    editingIndex: null as number | null,
    name: '',
    phone: '',
    relationship: undefined as Relationship | undefined,
    isAdding: false
  })

  // Computed property for calendar date model
  const dobModel = computed({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      if (val) formState.dateOfBirth = val.toString()
    }
  })

  // Utility functions
  const filterNonEmpty = (arr?: string[]) => arr?.filter((item) => item.trim() !== '') || []

  const filterNonEmptyContacts = (contacts?: any[]) => contacts?.filter((contact) => contact.phone.trim() !== '') || []

  const collectNotes = (formNotes?: any[]) => {
    const notesArray: Array<Note> = []

    if (formNotes && Array.isArray(formNotes)) {
      notesArray.push(...formNotes.filter((note) => note.content && note.content.trim() !== ''))
    }

    notesArray.push(...patientNotes.value.filter((note) => note.content.trim() !== ''))

    return notesArray.length > 0 ? notesArray : undefined
  }

  const { mutate: createPatient, isLoading } = useCreatePatient()
  async function onSubmit(_event: FormSubmitEvent<PatientCreate>) {
    if (!formState.organizationId) {
      console.error('Organization ID is missing')
      return
    }
    const submitData = {
      ...formState,
      medicalConditions: filterNonEmpty(formState.medicalConditions),
      surgeries: filterNonEmpty(formState.surgeries),
      allergies: filterNonEmpty(formState.allergies),
      medications: filterNonEmpty(formState.medications),
      emergencyContacts: filterNonEmptyContacts(formState.emergencyContacts),
      notes: collectNotes(formState.notes)
    }

    createPatient(submitData)
  }

  async function onError(_event: FormErrorEvent) {
    nextTick(() => formRef.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Emergency contact management
  function addOrUpdateContact() {
    if (!contactState.phone.trim()) return

    if (!formState.emergencyContacts) formState.emergencyContacts = []

    const contactData = {
      name: contactState.name.trim() || undefined,
      phone: contactState.phone.trim(),
      relationship: contactState.relationship || undefined
    }

    if (contactState.editingIndex !== null) {
      formState.emergencyContacts[contactState.editingIndex] = contactData
    } else {
      formState.emergencyContacts.push(contactData)
    }

    resetContactForm()
  }

  function startEditContact(index: number) {
    const contact = formState.emergencyContacts?.[index]
    if (!contact) return

    contactState.editingIndex = index
    contactState.name = contact.name || ''
    contactState.phone = contact.phone
    contactState.relationship = contact.relationship

    nextTick(() => {
      formRef.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function removeContact(index: number) {
    formState.emergencyContacts?.splice(index, 1)
  }

  function resetContactForm() {
    contactState.editingIndex = null
    contactState.name = ''
    contactState.phone = ''
    contactState.relationship = undefined
    contactState.isAdding = false
  }

  // Generic array item management
  function addArrayItem(arrayField: keyof PatientCreate, value: string) {
    if (!value.trim()) return

    const currentArray = (formState[arrayField] as string[]) || []
    currentArray.push(value.trim())
    ;(formState as any)[arrayField] = currentArray
  }

  function removeArrayItem(arrayField: keyof PatientCreate, index: number) {
    const currentArray = (formState[arrayField] as string[]) || []
    currentArray.splice(index, 1)
  }

  // Specific add functions using generic handler
  const addMedicalCondition = () => {
    addArrayItem('medicalConditions', arrayInputs.medicalCondition)
    arrayInputs.medicalCondition = ''
  }

  const addSurgery = () => {
    addArrayItem('surgeries', arrayInputs.surgery)
    arrayInputs.surgery = ''
  }

  const addAllergy = () => {
    addArrayItem('allergies', arrayInputs.allergy)
    arrayInputs.allergy = ''
  }

  const addMedication = () => {
    addArrayItem('medications', arrayInputs.medication)
    arrayInputs.medication = ''
  }

  // Note management
  function addNote() {
    if (!arrayInputs.note.trim()) return

    patientNotes.value.push({
      content: arrayInputs.note.trim(),
      date: new Date(),
      author: 'Dr. Martin' // FIXME: Should come from organization therapist/users
    })

    arrayInputs.note = ''
  }

  function removeNote(index: number) {
    patientNotes.value.splice(index, 1)
  }

  // Computed properties for UI state
  const showContactForm = computed(
    () =>
      (formState.emergencyContacts && formState.emergencyContacts.length > 0) ||
      contactState.isAdding ||
      contactState.editingIndex !== null
  )

  const contactButtonLabel = computed(() =>
    contactState.editingIndex !== null ? 'Mettre à jour le contact' : 'Ajouter le contact'
  )
</script>

<template>
  <UDashboardPanel id="new-patient" class="bg-elevated">
    <template #header>
      <UDashboardNavbar title="Nouveau patient">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <UBreadcrumb :items="breadcrumbItems" />
        <header class="my-6">
          <h1 class="text-xl leading-tight font-bold md:text-2xl">Nouvel Enregistrement Patient</h1>
        </header>

        <UForm
          ref="createPatientForm"
          :schema="patientCreateSchema"
          :state="formState"
          class="space-y-6"
          @submit="onSubmit"
          @error="onError"
        >
          <!-- Essential Information Section -->
          <UCard variant="outline" class="ring-primary">
            <h2 class="text-highlighted mb-4 text-lg font-bold">Informations Essentielles</h2>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <UFormField label="Prénom" name="firstName" required>
                <UInput v-model="formState.firstName" placeholder="ex: Jean" class="w-full" />
              </UFormField>
              <UFormField label="Nom" name="lastName" required>
                <UInput v-model="formState.lastName" placeholder="ex: Dupont" class="w-full" />
              </UFormField>
              <UFormField label="Date de naissance" name="dateOfBirth" required>
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start">
                    {{
                      dobModel
                        ? format(dobModel.toDate(getLocalTimeZone()), 'dd MMM yyyy', { locale: fr })
                        : 'Sélectionner une date'
                    }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="dobModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
              <UFormField label="Sexe" name="gender" required>
                <USelect
                  v-model="formState.gender"
                  placeholder="Sélectionner..."
                  class="w-full"
                  :items="[
                    { label: 'Homme', value: 'male' },
                    { label: 'Femme', value: 'female' }
                  ]"
                />
              </UFormField>
              <div class="md:col-span-2">
                <UFormField label="Téléphone" name="phone" required>
                  <UInput v-model="formState.phone" placeholder="ex: 06 12 34 56 78" type="tel" class="w-full" />
                </UFormField>
              </div>
            </div>
          </UCard>

          <!-- Two Column Layout for Details -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Left Column -->
            <div class="space-y-3">
              <!-- Contact Information -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-house" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Coordonnées</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default space-y-4 border-t p-4 sm:p-6">
                      <UFormField label="Email" name="email">
                        <UInput
                          v-model="formState.email"
                          placeholder="ex: jean.dupont@email.com"
                          type="email"
                          class="w-full"
                        />
                      </UFormField>
                      <UFormField label="Adresse" name="address">
                        <UTextarea
                          v-model="formState.address"
                          placeholder="123 Rue de la République, 75001 Paris, France"
                          :rows="3"
                          class="w-full"
                        />
                      </UFormField>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <UFormField label="Ville" name="city">
                          <UInput v-model="formState.city" placeholder="Paris" class="w-full" />
                        </UFormField>
                        <UFormField label="Code Postal" name="postalCode">
                          <UInput v-model="formState.postalCode" placeholder="75001" class="w-full" />
                        </UFormField>
                      </div>
                      <UFormField label="Pays" name="country">
                        <UInput v-model="formState.country" placeholder="France" class="w-full" />
                      </UFormField>
                    </div>
                  </template>
                </UCollapsible>
              </UCard>

              <!-- Emergency Contact -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-phone" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Contact d'Urgence</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default space-y-4 border-t p-4 sm:p-6">
                      <div v-if="showContactForm">
                        <div class="divide-default space-y-4 divide-y">
                          <div
                            v-for="(contact, index) in formState.emergencyContacts"
                            :key="index"
                            class="flex items-center justify-between pb-4"
                          >
                            <div class="flex items-center gap-4">
                              <UBadge icon="i-lucide-user" color="primary" variant="soft" size="lg" square />
                              <div>
                                <p class="font-semibold">{{ contact.name || 'Contact sans nom' }}</p>
                                <p class="text-muted flex gap-4 text-xs">
                                  <span class="flex items-center gap-1">
                                    <UIcon name="i-lucide-phone" class="size-3" />
                                    {{ contact.phone }}
                                  </span>
                                  <span v-if="contact.relationship" class="ml-2 flex items-center gap-1">
                                    <UIcon name="i-lucide-users" class="size-3" />
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
                                @click="removeContact(index)"
                              />
                            </div>
                          </div>
                        </div>

                        <!-- Add/Edit Contact Form -->
                        <div class="space-y-4 pt-4">
                          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <UFormField label="Téléphone du contact" required>
                              <UInput
                                v-model="contactState.phone"
                                placeholder="+1 (555) 987-6543"
                                class="w-full"
                                type="tel"
                              />
                            </UFormField>
                            <UFormField label="Nom du contact" hint="Optionnel">
                              <UInput v-model="contactState.name" placeholder="Jeanne Dupont" class="w-full" />
                            </UFormField>
                            <UFormField label="Relation" hint="Optionnel" class="md:col-span-2">
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
                              :disabled="!contactState.phone"
                              @click="addOrUpdateContact"
                            />
                            <UButton
                              label="Effacer"
                              color="neutral"
                              variant="ghost"
                              size="sm"
                              @click="resetContactForm"
                            />
                          </div>
                        </div>
                      </div>
                      <UEmpty
                        v-else
                        variant="naked"
                        icon="i-lucide-id-card"
                        title="Aucun contact d'urgence ajouté"
                        description="Il semble que vous n'ayez ajouté aucun contact. Ajoutez-en un pour commencer."
                        :actions="[
                          {
                            icon: 'i-lucide-plus',
                            label: 'Ajouter un contact',
                            variant: 'subtle',
                            onClick(event) {
                              event.stopPropagation()
                              resetContactForm()
                              contactState.isAdding = true
                            }
                          }
                        ]"
                        class="p-0 sm:p-0 lg:p-0"
                      />
                    </div>
                  </template>
                </UCollapsible>
              </UCard>

              <!-- Insurance -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-shield-user" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Assurance</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default grid grid-cols-1 gap-x-6 gap-y-4 border-t p-4 sm:grid-cols-2 sm:p-6">
                      <UFormField label="Nom de l'assurance/mutuelle" name="insuranceProvider">
                        <UInput
                          v-model="formState.insuranceProvider"
                          placeholder="ex: Mutuelle SantéPlus"
                          class="w-full"
                        />
                      </UFormField>
                      <UFormField label="Numéro de police" name="insuranceNumber">
                        <UInput v-model="formState.insuranceNumber" placeholder="ex: 987654321" class="w-full" />
                      </UFormField>
                    </div>
                  </template>
                </UCollapsible>
              </UCard>

              <!-- Referral -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-user-star" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Référé par</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default grid grid-cols-1 gap-x-6 gap-y-4 border-t p-4 sm:grid-cols-2 sm:p-6">
                      <UFormField label="Médecin/Praticien" name="referralSource">
                        <UInput v-model="formState.referralSource" placeholder="ex: Dr. Leblanc" class="w-full" />
                      </UFormField>
                    </div>
                  </template>
                </UCollapsible>
              </UCard>
            </div>

            <!-- Right Column -->
            <div class="space-y-3">
              <!-- Medical Information -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-briefcase-medical" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Informations Médicales</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default space-y-4 border-t p-4 sm:p-6">
                      <!-- Medical Conditions -->
                      <UFormField label="Antécédents médicaux" name="medicalConditions">
                        <div class="space-y-2">
                          <div
                            v-if="formState.medicalConditions && formState.medicalConditions.length > 0"
                            class="flex flex-wrap gap-2"
                          >
                            <UBadge
                              v-for="(condition, index) in formState.medicalConditions"
                              :key="index"
                              color="neutral"
                              variant="subtle"
                            >
                              {{ condition }}
                              <template #trailing>
                                <UButton
                                  icon="i-lucide-x"
                                  size="xs"
                                  color="neutral"
                                  variant="ghost"
                                  @click="removeArrayItem('medicalConditions', index)"
                                />
                              </template>
                            </UBadge>
                          </div>
                          <div class="flex gap-2">
                            <UInput
                              v-model="arrayInputs.medicalCondition"
                              placeholder="Ajouter une condition... ex : diabète de type 2, asthme"
                              class="w-full flex-1"
                              @keyup.enter="addMedicalCondition"
                            />
                            <UButton size="sm" @click="addMedicalCondition">
                              <UIcon name="i-lucide-plus" />
                            </UButton>
                          </div>
                        </div>
                      </UFormField>

                      <!-- Surgeries -->
                      <UFormField label="Chirurgies / Interventions" name="surgeries">
                        <div class="space-y-2">
                          <div
                            v-if="formState.surgeries && formState.surgeries.length > 0"
                            class="flex flex-wrap gap-2"
                          >
                            <UBadge
                              v-for="(surgery, index) in formState.surgeries"
                              :key="index"
                              color="primary"
                              variant="subtle"
                            >
                              {{ surgery }}
                              <template #trailing>
                                <UButton
                                  icon="i-lucide-x"
                                  size="xs"
                                  color="primary"
                                  variant="ghost"
                                  @click="removeArrayItem('surgeries', index)"
                                />
                              </template>
                            </UBadge>
                          </div>
                          <div class="flex gap-2">
                            <UInput
                              v-model="arrayInputs.surgery"
                              placeholder="Décrire l'intervention... ex : opération du genou (2020)"
                              class="w-full flex-1"
                              @keyup.enter="addSurgery"
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
                          <div
                            v-if="formState.allergies && formState.allergies.length > 0"
                            class="flex flex-wrap gap-2"
                          >
                            <UBadge
                              v-for="(allergy, index) in formState.allergies"
                              :key="index"
                              color="error"
                              variant="subtle"
                            >
                              {{ allergy }}
                              <template #trailing>
                                <UButton
                                  icon="i-lucide-x"
                                  size="xs"
                                  color="error"
                                  variant="ghost"
                                  @click="removeArrayItem('allergies', index)"
                                />
                              </template>
                            </UBadge>
                          </div>
                          <div class="flex gap-2">
                            <UInput
                              v-model="arrayInputs.allergy"
                              placeholder="Ajouter une allergie... ex : pénicilline, latex, pollen"
                              class="w-full flex-1"
                              @keyup.enter="addAllergy"
                            />
                            <UButton size="sm" @click="addAllergy">
                              <UIcon name="i-lucide-plus" />
                            </UButton>
                          </div>
                        </div>
                      </UFormField>

                      <!-- Medications -->
                      <UFormField label="Médicaments actuels" name="medications">
                        <div class="space-y-2">
                          <div
                            v-if="formState.medications && formState.medications.length > 0"
                            class="flex flex-wrap gap-2"
                          >
                            <UBadge
                              v-for="(medication, index) in formState.medications"
                              :key="index"
                              color="info"
                              variant="subtle"
                            >
                              {{ medication }}
                              <template #trailing>
                                <UButton
                                  icon="i-lucide-x"
                                  size="xs"
                                  color="info"
                                  variant="ghost"
                                  @click="removeArrayItem('medications', index)"
                                />
                              </template>
                            </UBadge>
                          </div>
                          <div class="flex gap-2">
                            <UInput
                              v-model="arrayInputs.medication"
                              placeholder="Indiquer le médicament... ex : Paracétamol 500 mg, Lévothyroxine"
                              class="w-full flex-1"
                              @keyup.enter="addMedication"
                            />
                            <UButton size="sm" @click="addMedication">
                              <UIcon name="i-lucide-plus" />
                            </UButton>
                          </div>
                        </div>
                      </UFormField>
                    </div>
                  </template>
                </UCollapsible>
              </UCard>

              <!-- Notes -->
              <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UCollapsible>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    class="group px-4 py-3 sm:px-6 sm:py-4"
                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                    trailing-icon="i-lucide-chevron-down"
                    block
                  >
                    <div class="flex items-center gap-3">
                      <UIcon name="i-lucide-file-text" class="text-muted text-xl" />
                      <h3 class="text-base font-bold">Notes Générales</h3>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default space-y-4 border-t p-4 sm:p-6">
                      <!-- Add new note -->
                      <div>
                        <UFormField label="Nouvelle note" name="newNote">
                          <UTextarea
                            v-model="arrayInputs.note"
                            placeholder="Ajouter une nouvelle note..."
                            :rows="3"
                            class="w-full"
                            @keyup.enter.ctrl="addNote"
                          />
                        </UFormField>
                        <div class="mt-3 flex justify-end gap-3">
                          <UButton label="Annuler" color="neutral" variant="subtle" @click="arrayInputs.note = ''" />
                          <UButton
                            label="Enregistrer"
                            color="primary"
                            :disabled="!arrayInputs.note.trim()"
                            @click="addNote"
                          />
                        </div>
                      </div>

                      <div class="border-default border-t">
                        <!-- Saved notes -->
                        <template v-if="patientNotes.length > 0">
                          <h4 class="text-foreground mb-2 text-sm font-semibold">Notes enregistrées</h4>
                          <ul class="space-y-3">
                            <li v-for="(note, index) in patientNotes" :key="index" class="bg-muted rounded-lg p-2">
                              <div class="flex items-start justify-between">
                                <div>
                                  <p class="text-foreground text-sm">{{ note.content }}</p>
                                  <p class="text-muted-foreground mt-1 text-xs">{{ note.date }} - {{ note.author }}</p>
                                </div>
                                <UButton
                                  icon="i-lucide-trash-2"
                                  size="xs"
                                  color="error"
                                  variant="ghost"
                                  @click="removeNote(index)"
                                  class="ml-2 shrink-0"
                                />
                              </div>
                            </li>
                          </ul>
                        </template>

                        <!-- Empty state -->
                        <UEmpty
                          v-else
                          variant="naked"
                          icon="i-lucide-file-text"
                          title="Aucune note ajoutée"
                          description="Ajoutez des notes pour suivre l'évolution du patient."
                          class="p-0"
                        />
                      </div>
                    </div>
                  </template>
                </UCollapsible>
              </UCard>
            </div>
          </div>
        </UForm>
      </UContainer>
    </template>

    <template #footer>
      <div class="bg-default py-2 backdrop-blur-sm">
        <UContainer>
          <div class="flex items-center justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="subtle" to="/patients" />
            <UButton
              @click="formRef?.submit()"
              :loading="isLoading"
              :disabled="isLoading"
              color="primary"
              label="Enregistrer"
            />
          </div>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
