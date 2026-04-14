<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types'
  import type { FormError } from '@nuxt/ui'

  interface Props {
    company?: InsuranceCompany
    onSuccess?: () => void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    close: [value?: any]
  }>()

  const toast = useToast()
  const createInsuranceCompany = useCreateInsuranceCompany()
  const updateInsuranceCompany = useUpdateInsuranceCompany()

  const isEdit = computed(() => !!props.company)

  const form = reactive({
    name: props.company?.name || '',
    code: props.company?.code || '',
    status: (props.company?.status || 'active') as 'active' | 'suspended' | 'terminated',
    coveragePercentage: props.company?.coveragePercentage || 80,
    sessionPriceCents: props.company?.sessionPriceCents || 5000,
    coPayRule: (props.company?.coPayRule || 'percentage') as 'fixed' | 'percentage',
    coPayAmountCents: props.company?.coPayAmountCents ?? undefined,
    coPayPercentage: props.company?.coPayPercentage ?? undefined,
    notes: props.company?.notes || ''
  })

  const formRef = useTemplateRef<{ submit: () => void }>('formRef')
  const isSubmitting = ref(false)

  function submitForm() {
    formRef.value?.submit()
  }

  const validate = (state: typeof form): FormError[] => {
    const errors: FormError[] = []

    if (!state.name?.trim()) {
      errors.push({ name: 'name', message: 'Le nom est requis' })
    }

    if (!state.code?.trim()) {
      errors.push({ name: 'code', message: 'Le code est requis' })
    }

    if (state.coveragePercentage < 0 || state.coveragePercentage > 100) {
      errors.push({ name: 'coveragePercentage', message: 'Le pourcentage de couverture doit être entre 0 et 100' })
    }

    if (state.sessionPriceCents < 100) {
      errors.push({ name: 'sessionPriceCents', message: 'Le prix de séance doit être au moins 1 DH' })
    }

    if (state.coPayRule === 'fixed' && !state.coPayAmountCents) {
      errors.push({ name: 'coPayAmountCents', message: 'Le montant de co-paiement est requis pour la règle fixe' })
    }

    if (state.coPayRule === 'percentage' && (state.coPayPercentage === null || state.coPayPercentage === undefined)) {
      errors.push({
        name: 'coPayPercentage',
        message: 'Le pourcentage de co-paiement est requis pour la règle pourcentage'
      })
    }

    if (state.coPayRule === 'percentage' && (state.coPayPercentage! < 0 || state.coPayPercentage! > 100)) {
      errors.push({ name: 'coPayPercentage', message: 'Le pourcentage de co-paiement doit être entre 0 et 100' })
    }

    return errors
  }

  async function onSubmit(event: FormSubmitEvent<typeof form>) {
    isSubmitting.value = true

    try {
      if (isEdit.value && props.company) {
        await updateInsuranceCompany.mutateAsync({
          companyId: props.company.id,
          companyData: event.data,
          onSuccess: () => {
            props.onSuccess?.()
            emit('close')
          }
        })
      } else {
        await createInsuranceCompany.mutateAsync(event.data as InsuranceCompanyCreate)
        props.onSuccess?.()
        emit('close')
      }
    } catch (err) {
      console.error('Failed to save insurance company:', err)
    } finally {
      isSubmitting.value = false
    }
  }

  const calculatedInsuranceAmount = computed(() => {
    if (form.coPayRule === 'fixed') {
      return Math.max(0, form.sessionPriceCents - (form.coPayAmountCents || 0))
    } else {
      const coPay = Math.round(form.sessionPriceCents * ((form.coPayPercentage || 0) / 100))
      return form.sessionPriceCents - coPay
    }
  })

  const calculatedCoPayAmount = computed(() => {
    if (form.coPayRule === 'fixed') {
      return form.coPayAmountCents || 0
    } else {
      return Math.round(form.sessionPriceCents * ((form.coPayPercentage || 0) / 100))
    }
  })
</script>

<template>
  <UModal>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ isEdit ? "Modifier la compagnie d'assurance" : "Nouvelle compagnie d'assurance" }}
      </h3>
    </template>

    <template #body>
      <UForm ref="formRef" :state="form" :validate="validate" @submit="onSubmit">
        <div class="space-y-4">
          <UFormField label="Nom" name="name" required>
            <UInput v-model="form.name" placeholder="Ex: Wafa Assurance" />
          </UFormField>

          <UFormField label="Code" name="code" required>
            <UInput v-model="form.code" placeholder="Ex: WAFA" uppercase />
          </UFormField>

          <UFormField label="Statut" name="status">
            <USelect
              v-model="form.status"
              :options="[
                { label: 'Active', value: 'active' },
                { label: 'Suspendue', value: 'suspended' },
                { label: 'Terminée', value: 'terminated' }
              ]"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Prix de séance (DH)" name="sessionPriceCents" required>
              <UInput v-model.number="form.sessionPriceCents" type="number" min="1" step="0.01">
                <template #trailing>
                  <span class="text-sm text-gray-500">DH</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Couverture (%)" name="coveragePercentage" required>
              <UInput v-model.number="form.coveragePercentage" type="number" min="0" max="100" step="1">
                <template #trailing>
                  <span class="text-sm text-gray-500">%</span>
                </template>
              </UInput>
            </UFormField>
          </div>

          <UFormField label="Règle de co-paiement" name="coPayRule" required>
            <USelect
              v-model="form.coPayRule"
              :options="[
                { label: 'Montant fixe', value: 'fixed' },
                { label: 'Pourcentage', value: 'percentage' }
              ]"
            />
          </UFormField>

          <UFormField
            v-if="form.coPayRule === 'fixed'"
            label="Montant de co-paiement (DH)"
            name="coPayAmountCents"
            required
          >
            <UInput v-model.number="form.coPayAmountCents" type="number" min="0" step="0.01">
              <template #trailing>
                <span class="text-sm text-gray-500">DH</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField
            v-if="form.coPayRule === 'percentage'"
            label="Pourcentage de co-paiement"
            name="coPayPercentage"
            required
          >
            <UInput v-model.number="form.coPayPercentage" type="number" min="0" max="100" step="1">
              <template #trailing>
                <span class="text-sm text-gray-500">%</span>
              </template>
            </UInput>
          </UFormField>

          <UPageCard v-if="form.sessionPriceCents > 0" title="Aperçu du calcul" variant="subtle" class="bg-gray-50">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Prix de séance:</span>
                <span class="font-medium">{{ (form.sessionPriceCents / 100).toFixed(2) }} DH</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Co-paiement du patient:</span>
                <span class="font-medium">{{ (calculatedCoPayAmount / 100).toFixed(2) }} DH</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Paiement de l'assurance:</span>
                <span class="font-medium text-green-600">{{ (calculatedInsuranceAmount / 100).toFixed(2) }} DH</span>
              </div>
              <div class="flex justify-between border-t border-gray-200 pt-2">
                <span class="font-medium">Total:</span>
                <span class="font-bold">{{ (form.sessionPriceCents / 100).toFixed(2) }} DH</span>
              </div>
            </div>
          </UPageCard>

          <UFormField label="Notes" name="notes">
            <UTextarea v-model="form.notes" :rows="3" placeholder="Notes additionnelles..." />
          </UFormField>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('close')" />
        <UButton label="Enregistrer" :loading="isSubmitting" @click="submitForm" />
      </div>
    </template>
  </UModal>
</template>
