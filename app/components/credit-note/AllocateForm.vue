<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'

  const props = defineProps<{
    creditNoteId: string
  }>()

  const emit = defineEmits<{
    allocated: []
  }>()

  const state = reactive({
    invoiceId: '',
    amountCents: 0
  })

  const amount = computed({
    get() {
      return state.amountCents / 100
    },
    set(val: number) {
      state.amountCents = Math.round(val * 100)
    }
  })

  const { mutate: createAllocation, isLoading } = useCreateCreditNoteAllocation()

  function onSubmit() {
    const creditNoteId = props.creditNoteId
    createAllocation.mutate(
      {
        creditNoteId,
        data: {
          creditNoteId,
          invoiceId: state.invoiceId,
          amountCents: state.amountCents
        }
      },
      {
        onSuccess: () => {
          emit('allocated')
        }
      }
    )
  }
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UFormField label="ID Facture">
      <UInput v-model="state.invoiceId" variant="subtle" required />
    </UFormField>

    <UFormField label="Montant (DH)">
      <UInput v-model.number="amount" variant="subtle" type="number" min="0.01" step="0.01" />
    </UFormField>

    <UButton type="submit" :loading="isLoading" label="Allouer" block />
  </form>
</template>
