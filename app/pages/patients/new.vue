<script setup lang="ts">
  import type { BreadcrumbItem, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
  import { format } from 'date-fns'
  import { fr } from 'date-fns/locale'
  import { getLocalTimeZone, parseDate } from '@internationalized/date'

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: 'Nouvelle fiche patient' }
  ] as Array<BreadcrumbItem>

  const { activeOrganization } = useOrganization()
  const { mutate: createPatient, isLoading } = useCreatePatient()

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

  // Computed property for calendar date model
  const dobModel = computed({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      if (val) formState.dateOfBirth = val.toString()
    }
  })

  watchEffect(() => {
    if (activeOrganization.value.data?.id) {
      formState.organizationId = activeOrganization.value.data.id
    }
  })

  async function onSubmit(_event: FormSubmitEvent<PatientCreate>) {
    if (!formState.organizationId) {
      console.error('Organization ID is missing')
      return
    }
    const submitData = {
      ...formState,
      medicalConditions: formState.medicalConditions?.filter((item) => item !== '') || undefined,
      surgeries: formState.surgeries?.filter((item) => item !== '') || undefined,
      allergies: formState.allergies?.filter((item) => item !== '') || undefined,
      medications: formState.medications?.filter((item) => item !== '') || undefined,
      emergencyContacts: formState.emergencyContacts?.filter((contact) => contact.number.trim() !== '') || undefined,
      notes: formState.notes?.filter((note) => note.content.trim() !== '') || undefined
    }

    createPatient(submitData)
  }

  async function onError(_event: FormErrorEvent) {
    nextTick(() => formRef.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
                      <PatientEmergencyContacts v-model="formState.emergencyContacts" />
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
                      <PatientMedicalInfoInput
                        v-model="formState.medicalConditions"
                        label="Antécédents médicaux"
                        name="medicalConditions"
                        placeholder="Ajouter une condition... ex : diabète de type 2, asthme"
                        badge-color="neutral"
                      />

                      <PatientMedicalInfoInput
                        v-model="formState.surgeries"
                        label="Chirurgies / Interventions"
                        name="surgeries"
                        placeholder="Décrire l'intervention... ex : opération du genou (2020)"
                        badge-color="primary"
                      />

                      <PatientMedicalInfoInput
                        v-model="formState.allergies"
                        label="Allergies"
                        name="allergies"
                        placeholder="Ajouter une allergie... ex : pénicilline, latex, pollen"
                        badge-color="error"
                      />

                      <PatientMedicalInfoInput
                        v-model="formState.medications"
                        label="Médicaments actuels"
                        name="medications"
                        placeholder="Indiquer le médicament... ex : Paracétamol 500 mg, Lévothyroxine"
                        badge-color="info"
                      />
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
                    <PatientNotes v-model="formState.notes" />
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
