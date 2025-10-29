<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import type { Patient } from '~~/shared/types/patient.types'

  const props = defineProps<{
    patient: Patient
  }>()

  const emit = defineEmits<{
    updated: [patient: Patient]
  }>()

  const schema = z.object({
    firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
    email: z.email('E‑mail invalide').optional().or(z.literal('')),
    phone: z.string().optional(),
    dateOfBirth: z.date().optional(),
    gender: z.enum(['male', 'female']).optional(),
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
    status: z.enum(['active', 'inactive', 'discharged']),
    notes: z.string().optional()
  })

  const open = ref(false)

  type Schema = z.output<typeof schema>

  const state = reactive<Partial<Schema>>({
    firstName: props.patient.firstName,
    lastName: props.patient.lastName,
    email: props.patient.email,
    phone: props.patient.phone,
    dateOfBirth: props.patient.dateOfBirth ? new Date(props.patient.dateOfBirth) : undefined,
    gender: props.patient.gender,
    address: props.patient.address,
    city: props.patient.city,
    postalCode: props.patient.postalCode,
    country: props.patient.country,
    emergencyContactName: props.patient.emergencyContactName,
    emergencyContactPhone: props.patient.emergencyContactPhone,
    emergencyContactRelationship: props.patient.emergencyContactRelationship,
    insuranceProvider: props.patient.insuranceProvider,
    insuranceNumber: props.patient.insuranceNumber,
    referralSource: props.patient.referralSource,
    referralDate: props.patient.referralDate ? new Date(props.patient.referralDate) : undefined,
    status: props.patient.status,
    notes: props.patient.notes
  })

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
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
      const response = (await $fetch(`/api/patients/${props.patient.id}`, {
        method: 'PUT',
        body: event.data
      })) as Patient

      toast.add({
        title: 'Succès',
        description: `Patient ${event.data.firstName} ${event.data.lastName} mis à jour avec succès`,
        color: 'success'
      })

      emit('updated', response)
      open.value = false

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

  function openModal() {
    // Reset state with current patient data
    Object.assign(state, {
      firstName: props.patient.firstName,
      lastName: props.patient.lastName,
      email: props.patient.email,
      phone: props.patient.phone,
      dateOfBirth: props.patient.dateOfBirth ? new Date(props.patient.dateOfBirth) : undefined,
      gender: props.patient.gender,
      address: props.patient.address,
      city: props.patient.city,
      postalCode: props.patient.postalCode,
      country: props.patient.country,
      emergencyContactName: props.patient.emergencyContactName,
      emergencyContactPhone: props.patient.emergencyContactPhone,
      emergencyContactRelationship: props.patient.emergencyContactRelationship,
      insuranceProvider: props.patient.insuranceProvider,
      insuranceNumber: props.patient.insuranceNumber,
      referralSource: props.patient.referralSource,
      referralDate: props.patient.referralDate ? new Date(props.patient.referralDate) : undefined,
      status: props.patient.status,
      notes: props.patient.notes
    })

    // Initialize calendar models with patient data
    if (props.patient.dateOfBirth) {
      const date = new Date(props.patient.dateOfBirth)
      dobModel.value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    }
    if (props.patient.referralDate) {
      const date = new Date(props.patient.referralDate)
      referralModel.value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    }

    open.value = true
  }
</script>

<template>
  <UModal
    v-model:open="open"
    title="Modifier le patient"
    :description="`Modifier les informations de ${patient.firstName} ${patient.lastName}`"
  >
    <UButton label="Modifier le patient" icon="i-lucide-edit" @click="openModal" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Prénom" placeholder="Jean" name="firstName">
            <UInput v-model="state.firstName" class="w-full" />
          </UFormField>
          <UFormField label="Nom" placeholder="Dupont" name="lastName">
            <UInput v-model="state.lastName" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="E‑mail" placeholder="john.doe@example.com" name="email">
            <UInput v-model="state.email" class="w-full" type="email" />
          </UFormField>
          <UFormField label="Téléphone" placeholder="+1 (555) 123-4567" name="phone">
            <UInput v-model="state.phone" class="w-full" type="tel" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Date de naissance" name="dateOfBirth">
            <UPopover>
              <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
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
        </div>

        <!-- Status -->
        <UFormField label="Statut" name="status">
          <USelect
            v-model="state.status"
            class="w-full"
            :items="[
              { label: 'Actif', value: 'active' },
              { label: 'Inactif', value: 'inactive' },
              { label: 'Sorti', value: 'discharged' }
            ]"
          />
        </UFormField>

        <!-- Address Information -->
        <UFormField label="Adresse" placeholder="123 rue Principale" name="address">
          <UInput v-model="state.address" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="Ville" placeholder="Paris" name="city">
            <UInput v-model="state.city" class="w-full" />
          </UFormField>
          <UFormField label="Code postal" placeholder="10001" name="postalCode">
            <UInput v-model="state.postalCode" class="w-full" />
          </UFormField>
          <UFormField label="Pays" placeholder="France" name="country">
            <UInput v-model="state.country" class="w-full" />
          </UFormField>
        </div>

        <!-- Emergency Contact -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Contact d’urgence</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nom du contact" placeholder="Jeanne Dupont" name="emergencyContactName">
              <UInput v-model="state.emergencyContactName" class="w-full" />
            </UFormField>
            <UFormField label="Téléphone du contact" placeholder="+1 (555) 987-6543" name="emergencyContactPhone">
              <UInput v-model="state.emergencyContactPhone" class="w-full" type="tel" />
            </UFormField>
          </div>
          <UFormField label="Relation" placeholder="Conjoint" name="emergencyContactRelationship">
            <UInput v-model="state.emergencyContactRelationship" class="w-full" />
          </UFormField>
        </div>

        <!-- Insurance Information -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Informations d’assurance</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Assureur" placeholder="Assureur" name="insuranceProvider">
              <UInput v-model="state.insuranceProvider" class="w-full" />
            </UFormField>
            <UFormField label="Numéro d’assurance" placeholder="123456789" name="insuranceNumber">
              <UInput v-model="state.insuranceNumber" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Referral Information -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Informations de recommandation</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Source de recommandation" placeholder="Dr. Martin" name="referralSource">
              <UInput v-model="state.referralSource" class="w-full" />
            </UFormField>
            <UFormField label="Date de recommandation" name="referralDate">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
                  {{ referralModel ? df.format(referralModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
                </UButton>

                <template #content>
                  <UCalendar v-model="referralModel" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
          </div>
        </div>

        <!-- Notes -->
        <UFormField label="Notes" placeholder="Notes supplémentaires sur le patient" name="notes">
          <UTextarea v-model="state.notes" class="w-full" :rows="3" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Mettre à jour" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
