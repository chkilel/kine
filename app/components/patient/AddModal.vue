<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

  const schema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.email('Invalid email').optional().or(z.literal('')),
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
    notes: z.string().optional()
  })

  const open = ref(false)

  type Schema = z.output<typeof schema>

  const state = reactive<Partial<Schema>>({
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    phone: undefined,
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
    notes: undefined
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
      const response = await $fetch('/api/patients', {
        method: 'POST',
        body: event.data
      })

      toast.add({
        title: 'Success',
        description: `New patient ${event.data.firstName} ${event.data.lastName} added`,
        color: 'success'
      })

      open.value = false

      // Refresh the patient list
      await refreshNuxtData()
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || 'Failed to create patient',
        color: 'error'
      })
    }
  }
</script>

<template>
  <UModal v-model:open="open" title="New patient" description="Add a new patient to the database">
    <UButton label="New patient" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Basic Information -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="First Name" placeholder="John" name="firstName">
            <UInput v-model="state.firstName" class="w-full" />
          </UFormField>
          <UFormField label="Last Name" placeholder="Doe" name="lastName">
            <UInput v-model="state.lastName" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Email" placeholder="john.doe@example.com" name="email">
            <UInput v-model="state.email" class="w-full" type="email" />
          </UFormField>
          <UFormField label="Phone" placeholder="+1 (555) 123-4567" name="phone">
            <UInput v-model="state.phone" class="w-full" type="tel" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Date of Birth" name="dateOfBirth">
            <UPopover>
              <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
                {{ dobModel ? df.format(dobModel.toDate(getLocalTimeZone())) : 'Select a date' }}
              </UButton>

              <template #content>
                <UCalendar v-model="dobModel" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
          <UFormField label="Gender" name="gender">
            <USelect
              v-model="state.gender"
              class="w-full"
              :items="[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' }
              ]"
            />
          </UFormField>
        </div>

        <!-- Address Information -->
        <UFormField label="Address" placeholder="123 Main St" name="address">
          <UInput v-model="state.address" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="City" placeholder="New York" name="city">
            <UInput v-model="state.city" class="w-full" />
          </UFormField>
          <UFormField label="Postal Code" placeholder="10001" name="postalCode">
            <UInput v-model="state.postalCode" class="w-full" />
          </UFormField>
          <UFormField label="Country" placeholder="USA" name="country">
            <UInput v-model="state.country" class="w-full" />
          </UFormField>
        </div>

        <!-- Emergency Contact -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Emergency Contact</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Contact Name" placeholder="Jane Doe" name="emergencyContactName">
              <UInput v-model="state.emergencyContactName" class="w-full" />
            </UFormField>
            <UFormField label="Contact Phone" placeholder="+1 (555) 987-6543" name="emergencyContactPhone">
              <UInput v-model="state.emergencyContactPhone" class="w-full" type="tel" />
            </UFormField>
          </div>
          <UFormField label="Relationship" placeholder="Spouse" name="emergencyContactRelationship">
            <UInput v-model="state.emergencyContactRelationship" class="w-full" />
          </UFormField>
        </div>

        <!-- Insurance Information -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Insurance Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Insurance Provider" placeholder="Blue Cross" name="insuranceProvider">
              <UInput v-model="state.insuranceProvider" class="w-full" />
            </UFormField>
            <UFormField label="Insurance Number" placeholder="123456789" name="insuranceNumber">
              <UInput v-model="state.insuranceNumber" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Referral Information -->
        <div class="border-t pt-4">
          <h3 class="mb-4 text-lg font-medium">Referral Information</h3>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Referral Source" placeholder="Dr. Smith" name="referralSource">
              <UInput v-model="state.referralSource" class="w-full" />
            </UFormField>
            <UFormField label="Referral Date" name="referralDate">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
                  {{ referralModel ? df.format(referralModel.toDate(getLocalTimeZone())) : 'Select a date' }}
                </UButton>

                <template #content>
                  <UCalendar v-model="referralModel" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
          </div>
        </div>

        <!-- Notes -->
        <UFormField label="Notes" placeholder="Additional notes about the patient" name="notes">
          <UTextarea v-model="state.notes" class="w-full" :rows="3" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Create" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
