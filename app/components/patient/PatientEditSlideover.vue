<script setup lang="ts">
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { patientUpdateSchema } from '~~/shared/types/patient.types'
  import type { Patient, PatientUpdate } from '~~/shared/types/patient.types'

  const props = defineProps<{
    patient: Patient
    open: boolean
  }>()

  const emit = defineEmits<{
    'update:open': [value: boolean]
    updated: [patient: Patient]
  }>()
  const schema = patientUpdateSchema

  // Emergency contact state
  const emergencyContactName = ref('')
  const emergencyContactPhone = ref('')
  const emergencyContactRelationship = ref('')

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

  const toast = useToast()
  const formRef = ref()

  async function onSubmit() {
    if (!formRef.value) return

    try {
      const validationResult = await formRef.value.validate()
      if (!validationResult) return

      const response = (await $fetch(`/api/patients/${props.patient.id}`, {
        method: 'PUT',
        body: state
      })) as Patient

      toast.add({
        title: 'Succès',
        description: `Patient ${state.firstName} ${state.lastName} mis à jour avec succès`,
        color: 'success'
      })

      emit('updated', response)
      emit('update:open', false)

      // Refresh the patient data
      await refreshNuxtData()
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

  function handleCancel() {
    emit('update:open', false)
  }

  // Watch for open prop changes to reset form
  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        // Reset state with current patient data
        Object.assign(state, {
          firstName: props.patient.firstName,
          lastName: props.patient.lastName,
          email: props.patient.email || undefined,
          phone: props.patient.phone || undefined,
          dateOfBirth: props.patient.dateOfBirth,
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

        // Reset emergency contact form
        emergencyContactName.value = ''
        emergencyContactPhone.value = ''
        emergencyContactRelationship.value = ''

        // Reset notes form
        newNoteContent.value = ''

        // Initialize calendar models with patient data
        if (props.patient.dateOfBirth) {
          const date = new Date(props.patient.dateOfBirth)
          dobModel.value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
        }
      }
    }
  )
</script>

<template>
  <USlideover
    :open="open"
    :dismissible="false"
    @update:open="emit('update:open', $event)"
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
    :ui="{
      content: 'w-full md:w-3/4 lg:w-3/4 max-w-4xl bg-elevated'
    }"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" class="space-y-6">
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
                :items="[
                  { label: 'Actif', value: 'active' },
                  { label: 'Inactif', value: 'inactive' },
                  { label: 'Sorti', value: 'discharged' }
                ]"
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
            <div v-if="state.emergencyContacts?.length" class="space-y-4">
              <div
                v-for="(contact, index) in state.emergencyContacts"
                :key="`contact-${index}`"
                class="group bg-muted p-2"
              >
                <div class="flex items-start gap-4">
                  <div class="bg-elevated flex size-13 shrink-0 items-center justify-center rounded-xl">
                    <UIcon name="i-lucide-user" class="text-primary text-xl" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0 flex-1 space-y-3">
                        <div class="space-y-2">
                          <h4 class="truncate text-base font-semibold tracking-tight">
                            {{ contact.name || 'Contact sans nom' }}
                          </h4>
                          <div class="flex items-center gap-4 text-sm">
                            <div class="flex items-center gap-2">
                              <UIcon name="i-lucide-phone" class="h-4 w-4" />
                              <span>{{ contact.phone }}</span>
                            </div>
                            <div v-if="contact.relationship" class="flex items-center gap-2">
                              <UIcon name="i-lucide-users" class="h-4 w-4" />
                              <span>{{ contact.relationship }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <UButton
                          icon="i-lucide-edit-2"
                          size="xs"
                          color="primary"
                          variant="ghost"
                          class="opacity-0 transition-all duration-200 group-hover:opacity-100"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          color="error"
                          variant="ghost"
                          class="opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-50"
                          @click="state.emergencyContacts?.splice(index, 1)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField label="Nom du contact" placeholder="Jeanne Dupont">
                <UInput v-model="emergencyContactName" class="w-full" />
              </UFormField>
              <UFormField label="Téléphone du contact" placeholder="+1 (555) 987-6543">
                <UInput v-model="emergencyContactPhone" class="w-full" type="tel" />
              </UFormField>
              <UFormField label="Relation" placeholder="Conjoint" class="md:col-span-2">
                <UInput v-model="emergencyContactRelationship" class="w-full" />
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
