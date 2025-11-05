<script setup lang="ts">
  import type { BreadcrumbItem, FormSubmitEvent } from '@nuxt/ui'
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
  const newNote = ref('')
  const patientNotes = ref<Array<{ content: string; date: Date; author: string }>>([])

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Dashboard', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: 'Nouvelle fiche patient' }
  ])

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
        emergencyContacts: event.data.emergencyContacts?.filter((contact) => contact.phone.trim() !== '') || [],
        // Combine existing notes with new notes as array of objects
        notes: (() => {
          const notesArray: Array<{ content: string; date: Date; author: string }> = []

          // Add existing notes if any
          if (event.data.notes && Array.isArray(event.data.notes)) {
            notesArray.push(...event.data.notes.filter((note) => note.content && note.content.trim() !== ''))
          }

          // Add patient notes
          notesArray.push(...patientNotes.value.filter((note) => note.content.trim() !== ''))

          return notesArray.length > 0 ? notesArray : undefined
        })()
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

  function addNote() {
    if (newNote.value.trim()) {
      patientNotes.value.push({
        content: newNote.value.trim(),
        date: new Date(),
        author: 'Dr. Martin' // This should come from current user context
      })

      newNote.value = ''
    }
  }

  function removeNote(index: number) {
    patientNotes.value.splice(index, 1)
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
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <!-- Essential Information Section -->
          <UCard variant="outline" class="ring-primary">
            <h2 class="text-highlighted mb-4 text-lg font-bold">Informations Essentielles</h2>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <UFormField label="Prénom" name="firstName" required>
                <UInput v-model="state.firstName" placeholder="ex: Jean" class="w-full" />
              </UFormField>
              <UFormField label="Nom" name="lastName" required>
                <UInput v-model="state.lastName" placeholder="ex: Dupont" class="w-full" />
              </UFormField>
              <UFormField label="Date de naissance" name="dateOfBirth" required>
                <UPopover>
                  <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start">
                    {{ dobModel ? df.format(dobModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="dobModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
              <UFormField label="Sexe" name="gender" required>
                <USelect
                  v-model="state.gender"
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
                  <UInput v-model="state.phone" placeholder="ex: 06 12 34 56 78" type="tel" class="w-full" />
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
                          v-model="state.email"
                          placeholder="ex: jean.dupont@email.com"
                          type="email"
                          class="w-full"
                        />
                      </UFormField>
                      <UFormField label="Adresse" name="address">
                        <UTextarea
                          v-model="state.address"
                          placeholder="123 Rue de la République, 75001 Paris, France"
                          :rows="3"
                          class="w-full"
                        />
                      </UFormField>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <UFormField label="Ville" name="city">
                          <UInput v-model="state.city" placeholder="Paris" class="w-full" />
                        </UFormField>
                        <UFormField label="Code Postal" name="postalCode">
                          <UInput v-model="state.postalCode" placeholder="75001" class="w-full" />
                        </UFormField>
                      </div>
                      <UFormField label="Pays" name="country">
                        <UInput v-model="state.country" placeholder="France" class="w-full" />
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
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <UIcon name="i-lucide-phone" class="text-muted text-xl" />
                        <h3 class="text-base font-bold">Contact d'Urgence</h3>
                      </div>
                    </div>
                  </UButton>

                  <template #content>
                    <div class="border-default space-y-4 border-t p-4 sm:p-6">
                      <div v-if="state.emergencyContacts && state.emergencyContacts.length > 0" class="space-y-4">
                        <div
                          v-for="(contact, index) in state.emergencyContacts"
                          :key="index"
                          class="border-default rounded-lg border p-3"
                        >
                          <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <div class="sm:col-span-2">
                              <UFormField :label="`Nom complet ${index + 1}`" :name="`emergencyContacts.${index}.name`">
                                <UInput v-model="contact.name" placeholder="ex: Sophie Dupont" class="w-full" />
                              </UFormField>
                            </div>
                            <UFormField
                              :label="`Relation ${index + 1}`"
                              :name="`emergencyContacts.${index}.relationship`"
                            >
                              <UInput v-model="contact.relationship" placeholder="ex: Épouse" class="w-full" />
                            </UFormField>
                            <UFormField :label="`Téléphone ${index + 1}`" :name="`emergencyContacts.${index}.phone`">
                              <UInput
                                v-model="contact.phone"
                                placeholder="ex: 06 87 65 43 21"
                                type="tel"
                                class="w-full"
                              />
                            </UFormField>
                            <div class="flex justify-end sm:col-span-2">
                              <UButton size="xs" color="error" variant="ghost" @click="removeEmergencyContact(index)">
                                <UIcon name="i-lucide-trash-2" />
                              </UButton>
                            </div>
                          </div>
                        </div>
                        <UButton size="xs" color="primary" variant="soft" @click.stop="addEmergencyContact">
                          <UIcon name="i-lucide-plus" class="mr-1" />
                          Ajouter
                        </UButton>
                      </div>
                      <div v-else>
                        <UEmpty
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
                                addEmergencyContact()
                              }
                            }
                          ]"
                          class="p-0 sm:p-0 lg:p-0"
                        />
                      </div>
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
                        <UInput v-model="state.insuranceProvider" placeholder="ex: Mutuelle SantéPlus" class="w-full" />
                      </UFormField>
                      <UFormField label="Numéro de police" name="insuranceNumber">
                        <UInput v-model="state.insuranceNumber" placeholder="ex: 987654321" class="w-full" />
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
                        <UInput v-model="state.referralSource" placeholder="ex: Dr. Leblanc" class="w-full" />
                      </UFormField>
                      <UFormField label="Date de référence" name="referralDate">
                        <UPopover>
                          <UButton
                            color="neutral"
                            variant="subtle"
                            icon="i-lucide-calendar"
                            class="w-full justify-start"
                          >
                            {{
                              referralModel
                                ? df.format(referralModel.toDate(getLocalTimeZone()))
                                : 'Sélectionner une date'
                            }}
                          </UButton>
                          <template #content>
                            <UCalendar v-model="referralModel" class="p-2" />
                          </template>
                        </UPopover>
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
                      <!-- Antécédents médicaux -->
                      <UFormField label="Antécédents médicaux" name="medicalConditions">
                        <div class="space-y-2">
                          <div
                            v-if="state.medicalConditions && state.medicalConditions.length > 0"
                            class="flex flex-wrap gap-2"
                          >
                            <UBadge
                              v-for="(condition, index) in state.medicalConditions"
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
                              v-model="newMedicalCondition"
                              placeholder="Ajouter une condition... ex : diabète de type 2, asthme"
                              @keyup.enter="addMedicalCondition"
                              class="w-full flex-1"
                            />
                            <UButton size="sm" @click="addMedicalCondition">
                              <UIcon name="i-lucide-plus" />
                            </UButton>
                          </div>
                        </div>
                      </UFormField>

                      <!-- Chirurgies / Interventions -->
                      <UFormField label="Chirurgies / Interventions" name="surgeries">
                        <div class="space-y-2">
                          <div v-if="state.surgeries && state.surgeries.length > 0" class="flex flex-wrap gap-2">
                            <UBadge
                              v-for="(surgery, index) in state.surgeries"
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
                              v-model="newSurgery"
                              placeholder="Décrire l’intervention... ex : opération du genou (2020)"
                              @keyup.enter="addSurgery"
                              class="w-full flex-1"
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
                            <UBadge
                              v-for="(allergy, index) in state.allergies"
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
                              v-model="newAllergy"
                              placeholder="Ajouter une allergie... ex : pénicilline, latex, pollen"
                              @keyup.enter="addAllergy"
                              class="w-full flex-1"
                            />
                            <UButton size="sm" @click="addAllergy">
                              <UIcon name="i-lucide-plus" />
                            </UButton>
                          </div>
                        </div>
                      </UFormField>

                      <!-- Médicaments actuels -->
                      <UFormField label="Médicaments actuels" name="medications">
                        <div class="space-y-2">
                          <div v-if="state.medications && state.medications.length > 0" class="flex flex-wrap gap-2">
                            <UBadge
                              v-for="(medication, index) in state.medications"
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
                              v-model="newMedication"
                              placeholder="Indiquer le médicament... ex : Paracétamol 500 mg, Lévothyroxine"
                              @keyup.enter="addMedication"
                              class="w-full flex-1"
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
                            v-model="newNote"
                            placeholder="Ajouter une nouvelle note..."
                            :rows="3"
                            class="w-full"
                            @keyup.enter.ctrl="addNote"
                          />
                        </UFormField>
                        <div class="mt-3 flex justify-end gap-3">
                          <UButton label="Annuler" color="neutral" variant="subtle" @click="newNote = ''" />
                          <UButton label="Enregistrer" color="primary" @click="addNote" :disabled="!newNote.trim()" />
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
            <UButton label="Annuler" color="neutral" variant="subtle" @click="router.push('/patients')" />
            <UFieldGroup>
              <UButton @click="submitButton" color="primary" label="Enregistrer" />

              <UDropdownMenu
                :items="[
                  {
                    label: 'Enregistrer & Planifier RDV',
                    icon: 'i-lucide-calendar-plus',
                    disabled: true
                  }
                ]"
                :popper="{ placement: 'bottom-end' }"
              >
                <UButton icon="i-lucide-chevron-down" />
              </UDropdownMenu>
            </UFieldGroup>
          </div>
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>
</template>
