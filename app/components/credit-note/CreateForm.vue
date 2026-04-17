<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{
    patientId: string
  }>()

  const emit = defineEmits<{
    created: [creditNote: any]
  }>()

  const state = reactive({
    type: 'correction' as CreditNoteType,
    amountCents: 0,
    reason: '',
    notes: ''
  })

  const amount = computed({
    get() {
      return state.amountCents / 100
    },
    set(val: number) {
      state.amountCents = Math.round(val * 100)
    }
  })

  const { mutate: createCreditNote, isLoading } = useCreateCreditNote()

  function onSubmit() {
    ;(createCreditNote as any)({
      data: {
        patientId: props.patientId,
        type: state.type,
        amountCents: state.amountCents,
        reason: state.reason,
        notes: state.notes || undefined
      },
      onSuccess: (creditNote: any) => {
        emit('created', creditNote)
      }
    })
  }
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UFormField label="Type">
      <USelect
        v-model="state.type"
        variant="subtle"
        :options="[
          { label: 'Correction', value: 'correction' },
          { label: 'Remboursement', value: 'refund' }
        ]"
      />
    </UFormField>

    <UFormField label="Montant (DH)">
      <UInput v-model.number="amount" variant="subtle" type="number" min="0.01" step="0.01" />
    </UFormField>

    <UFormField label="Raison">
      <UTextarea v-model="state.reason" variant="subtle" :rows="3" required />
    </UFormField>

    <UFormField label="Notes">
      <UTextarea v-model="state.notes" variant="subtle" :rows="2" />
    </UFormField>

    <UButton type="submit" :loading="isLoading" label="Créer l'avoir" block />
  </form>
</template>
