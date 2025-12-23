<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'

  const props = defineProps<{ patient: Patient }>()
  const emit = defineEmits<{ close: [] }>()

  const { user } = await useAuth()
  const { mutate: updatePatient, isLoading } = useUpdatePatient()

  const formRef = ref<HTMLFormElement>()

  function deepCloneArray<T>(arr: T[] | null): T[] {
    if (!arr) return []
    return JSON.parse(JSON.stringify(arr))
  }

  function getInitialFormState(): PatientUpdate {
    return {
      organizationId: props.patient.organizationId,
      firstName: props.patient.firstName,
      lastName: props.patient.lastName,
      dateOfBirth: props.patient.dateOfBirth,
      gender: props.patient.gender,
      phone: props.patient.phone,
      status: props.patient.status,
      address: props.patient.address,
      city: props.patient.city,
      country: props.patient.country,
      postalCode: props.patient.postalCode,
      referralSource: props.patient.referralSource,
      insuranceProvider: props.patient.insuranceProvider,
      insuranceNumber: props.patient.insuranceNumber,
      email: props.patient.email,
      medicalConditions: props.patient.medicalConditions,
      surgeries: props.patient.surgeries,
      allergies: props.patient.allergies,
      medications: props.patient.medications,
      emergencyContacts: deepCloneArray(props.patient.emergencyContacts),
      notes: deepCloneArray(props.patient.notes)
    }
  }

  const formState = reactive<PatientUpdate>(getInitialFormState())
  const newNoteContent = ref('')

  const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })
  const dobModel = computed<CalendarDate | null>({
    get: () => (formState.dateOfBirth ? parseDate(formState.dateOfBirth) : null),
    set: (val) => {
      formState.dateOfBirth = val ? val.toString() : undefined
    }
  })

  async function onSubmit() {
    if (!formRef.value) return

    const validationResult = await formRef.value.validate()
    if (!validationResult) return

    updatePatient({ patientId: props.patient.id, patientData: formState, onSuccess: () => emit('close') })
  }

  function addNote() {
    const content = newNoteContent.value.trim()
    if (!content) return

    if (!formState.notes) formState.notes = []

    formState.notes.push({
      date: today(getLocalTimeZone()).toString(),
      author: user.value ? `Dr. ${user.value.lastName}` : 'Unknown',
      content
    })

    newNoteContent.value = ''
  }

  function removeNote(index: number) {
    formState.notes?.splice(index, 1)
  }

  function handleClose() {
    emit('close')
  }

  function onSlideoverOpened() {
    Object.assign(formState, getInitialFormState())
  }
</script>

<template>
  <USlideover
    :open="true"
    :dismissible="false"
    @close="emit('close')"
    @after:enter="onSlideoverOpened"
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="patientUpdateSchema" :state="formState" class="space-y-6">
        <!-- Basic Information -->
        <AppCard title="Informations de base" variant="outline">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Prénom" placeholder="Jean" name="firstName">
              <UInput v-model="formState.firstName" class="w-full" />
            </UFormField>
            <UFormField label="Nom" placeholder="Dupont" name="lastName">
              <UInput v-model="formState.lastName" class="w-full" />
            </UFormField>
            <UFormField label="E‑mail" placeholder="john.doe@example.com" name="email">
              <UInput v-model="formState.email" class="w-full" type="email" />
            </UFormField>
            <UFormField label="Téléphone" placeholder="+1 (555) 123-4567" name="phone">
              <UInput v-model="formState.phone" class="w-full" type="tel" />
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
                v-model="formState.gender"
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
                v-model="formState.status"
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
              <UInput v-model="formState.address" class="w-full" />
            </UFormField>
            <UFormField label="Ville" placeholder="Paris" name="city">
              <UInput v-model="formState.city" class="w-full" />
            </UFormField>
            <UFormField label="Code postal" placeholder="10001" name="postalCode">
              <UInput v-model="formState.postalCode" class="w-full" />
            </UFormField>
            <UFormField label="Pays" placeholder="France" name="country" class="md:col-span-2">
              <UInput v-model="formState.country" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <!-- Emergency Contact -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Contact d'urgence</h3>
          <PatientEmergencyContacts v-model="formState.emergencyContacts" />
        </AppCard>

        <!-- Insurance Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations d'assurance</h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormField label="Assureur" placeholder="Assureur" name="insuranceProvider">
              <UInput v-model="formState.insuranceProvider" class="w-full" />
            </UFormField>
            <UFormField label="Numéro d'assurance" placeholder="123456789" name="insuranceNumber">
              <UInput v-model="formState.insuranceNumber" class="w-full" />
            </UFormField>
          </div>
        </AppCard>

        <!-- Referral Information -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Informations de recommandation</h3>
          <UFormField label="Source de recommandation" placeholder="Dr. Martin" name="referralSource">
            <UInput v-model="formState.referralSource" class="w-full" />
          </UFormField>
        </AppCard>

        <!-- Notes -->
        <AppCard variant="outline">
          <h3 class="text-highlighted mb-4 text-base font-bold">Notes</h3>
          <div class="space-y-4">
            <div v-if="formState.notes?.length" class="space-y-2">
              <div
                v-for="(note, index) in formState.notes"
                :key="`note-${index}`"
                class="flex items-start justify-between rounded-lg border p-3"
              >
                <div class="flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-sm font-medium">{{ note.author }}</span>
                    <span class="text-muted text-xs">{{ new Date(note.date).toLocaleDateString('fr-FR') }}</span>
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
        <UButton variant="outline" color="neutral" class="h-9 px-3 text-sm font-semibold" @click="handleClose">
          Annuler
        </UButton>
        <UButton
          color="primary"
          class="h-9 px-3 text-sm font-semibold"
          type="submit"
          @click="onSubmit"
          :loading="isLoading"
          :disabled="isLoading"
        >
          Mettre à jour
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
