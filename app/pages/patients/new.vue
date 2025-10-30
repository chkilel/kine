<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const schema = z.object({
    firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
    email: z.email('E-mail invalide').optional().or(z.literal('')),
    phone: z.string().optional(),
    dateOfBirth: z.date('Date de naissance invalide'),
    gender: z.enum(['male', 'female'], {
      error: 'Veuillez sélectionner un genre'
    }),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelationship: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insuranceNumber: z.string().optional(),
    referralSource: z.string().optional(),
    referralDate: z.date().optional(),
    mainComplaint: z.string().optional(),
    diagnosis: z.string().optional(),
    conditions: z.string().optional(),
    surgeries: z.string().optional(),
    allergies: z.string().optional(),
    medications: z.string().optional(),
    insuranceDetails: z.string().optional(),
    billingNotes: z.string().optional(),
    notes: z.string().optional(),
    patientId: z.string().optional()
  })

  type Schema = z.output<typeof schema>

  const state = reactive<Partial<Schema>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: undefined,
    gender: undefined,
    address: undefined,
    city: undefined,
    postalCode: undefined,
    country: undefined,
    emergencyContactName: undefined,
    emergencyContactPhone: undefined,
    emergencyContactRelationship: undefined,
    insuranceProvider: undefined,
    insuranceNumber: undefined,
    referralSource: undefined,
    referralDate: undefined,
    mainComplaint: undefined,
    diagnosis: undefined,
    conditions: undefined,
    surgeries: undefined,
    allergies: undefined,
    medications: undefined,
    insuranceDetails: undefined,
    billingNotes: undefined,
    notes: undefined
  })

  const form = useTemplateRef<HTMLFormElement>('createPatientForm')

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

  const toast = useToast()
  const router = useRouter()

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
      const response = await $fetch('/api/patients', {
        method: 'POST',
        body: event.data
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
      label: 'Informations cliniques',
      icon: 'i-lucide-stethoscope',
      slot: 'clinical-info'
    },
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

      <UForm ref="createPatientForm" :schema="schema" :state="state" @submit="onSubmit">
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
                <UFormField label="Téléphone" name="phone" required>
                  <UInput v-model="state.phone" placeholder="06 12 34 56 78" type="tel" class="w-full" />
                </UFormField>
                <UFormField label="Numéro de dossier / ID Patient" name="patientId">
                  <UInput v-model="state.patientId" placeholder="MM123/20025" type="text" class="w-full" />
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
              <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <!-- <UFormField label="Contact d'urgence (Nom optionnel)" name="emergencyContactName">
                   <UInput v-model="state.emergencyContactName" placeholder="Optionnel" class="w-full" />
                  </UFormField> -->
                <UFormField label="Contact d'urgence (Tél.)" name="emergencyContactPhone">
                  <UInput
                    v-model="state.emergencyContactPhone"
                    placeholder="06 98 76 54 32"
                    type="tel"
                    class="w-full"
                  />
                </UFormField>
                <!-- <UFormField label="Relation (optionnel)" name="emergencyContactRelationship">
                    <UInput v-model="state.emergencyContactRelationship" placeholder="Épouse, Mère..." class="w-full" />
                  </UFormField> -->
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
              item: 'rounded-lg bg-default ring ring-default divide-y divide-default',
              header: 'px-4 sm:px-6',
              leadingIcon: 'text-primary'
            }"
          >
            <!-- Clinical Information -->
            <template #clinical-info>
              <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <UFormField label="Plainte principale" name="mainComplaint">
                  <UInput v-model="state.mainComplaint" placeholder="ex: Douleur au genou droit" />
                </UFormField>
                <UFormField label="Diagnostic" name="diagnosis">
                  <UInput v-model="state.diagnosis" placeholder="ex: Syndrome fémoro-patellaire" />
                </UFormField>
              </div>
            </template>

            <!-- Medical History -->
            <template #medical-history>
              <div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <UFormField label="Conditions" name="conditions">
                  <UTextarea v-model="state.conditions" placeholder="Conditions médicales préexistantes" :rows="3" />
                </UFormField>
                <UFormField label="Chirurgies" name="surgeries">
                  <UTextarea v-model="state.surgeries" placeholder="Chirurgies antérieures" :rows="3" />
                </UFormField>
                <UFormField label="Allergies" name="allergies">
                  <UTextarea v-model="state.allergies" placeholder="Allergies connues" :rows="3" />
                </UFormField>
                <UFormField label="Médicaments" name="medications">
                  <UTextarea v-model="state.medications" placeholder="Médicaments actuels" :rows="3" />
                </UFormField>
              </div>
            </template>

            <!-- Insurance & Billing -->
            <template #insurance-billing>
              <div class="grid grid-cols-1 gap-6 p-6">
                <UFormField label="Détails d'assurance" name="insuranceDetails">
                  <UTextarea
                    v-model="state.insuranceDetails"
                    placeholder="Numéro de police, assureur, etc."
                    :rows="4"
                  />
                </UFormField>
                <UFormField label="Notes de facturation" name="billingNotes">
                  <UTextarea v-model="state.billingNotes" placeholder="Tiers payant, ALD, etc." :rows="3" />
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
