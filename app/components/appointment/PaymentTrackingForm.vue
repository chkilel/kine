<script setup lang="ts">
  interface Props {
    appointment: Appointment
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ close: [] }>()

  const { mutate: updatePayments, isLoading: isSubmitting } = useUpdateAppointmentPayments()

  const form = reactive({
    coPayPaidCents: (props.appointment.coPayPaidCents ?? 0) / 100,
    insurancePaidCents: (props.appointment.insurancePaidCents ?? 0) / 100
  })

  const expectedCoPay = computed(() =>
    props.appointment.expectedCoPayCents ? props.appointment.expectedCoPayCents / 100 : null
  )
  const expectedInsurance = computed(() =>
    props.appointment.expectedInsuranceCents ? props.appointment.expectedInsuranceCents / 100 : null
  )

  async function handleSubmit() {
    updatePayments({
      appointmentId: props.appointment.id,
      body: {
        coPayPaidCents: Math.round(form.coPayPaidCents * 100),
        insurancePaidCents: Math.round(form.insurancePaidCents * 100)
      },
      onSuccess: () => {
        emit('close')
      }
    })
  }
</script>

<template>
  <UModal :dismissible="!isSubmitting">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold">Enregistrer les paiements</h3>
          <p class="text-muted mt-0.5 text-sm">Saisissez les montants réellement perçus.</p>
        </div>
        <UButton icon="i-hugeicons-cancel-01" color="neutral" variant="ghost" @click="emit('close')" />
      </div>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Co-paiement patient (DH)">
            <UInput v-model.number="form.coPayPaidCents" type="number" min="0" step="0.01">
              <template #trailing>
                <span class="text-xs text-gray-400">DH</span>
              </template>
            </UInput>
            <p v-if="expectedCoPay" class="mt-1 text-xs text-gray-400">Attendu: {{ expectedCoPay.toFixed(2) }} DH</p>
          </UFormField>

          <UFormField label="Paiement assurance (DH)">
            <UInput v-model.number="form.insurancePaidCents" type="number" min="0" step="0.01">
              <template #trailing>
                <span class="text-xs text-gray-400">DH</span>
              </template>
            </UInput>
            <p v-if="expectedInsurance" class="mt-1 text-xs text-gray-400">
              Attendu: {{ expectedInsurance.toFixed(2) }} DH
            </p>
          </UFormField>
        </div>

        <div class="flex justify-end gap-2">
          <UButton type="button" variant="ghost" color="neutral" @click="emit('close')">Annuler</UButton>
          <UButton type="submit" :loading="isSubmitting" label="Enregistrer" />
        </div>
      </form>
    </template>
  </UModal>
</template>
