<script setup lang="ts">
  import type { FormSubmitEvent } from '#ui/types'
  import type { FormError } from '@nuxt/ui'
  import { z } from 'zod'

  const props = defineProps<{
    company?: InsuranceCompany
    onSuccess?: () => void
  }>()
  const emit = defineEmits<{ close: [] }>()

  const createInsuranceCompany = useCreateInsuranceCompany()
  const updateInsuranceCompany = useUpdateInsuranceCompany()

  const isEdit = computed(() => !!props.company)
  const slideoverTitle = computed(() =>
    isEdit.value ? "Modifier la compagnie d'assurance" : "Nouvelle compagnie d'assurance"
  )
  const slideoverDescription = computed(() => {
    if (isEdit.value && props.company) {
      return `Modifier les informations de ${props.company.name}`
    }
    return "Créer une nouvelle compagnie d'assurance"
  })

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

  const formSchema = z
    .object({
      name: z.string().min(1, 'Le nom est requis'),
      code: z.string().min(1, 'Le code est requis'),
      status: z.enum(['active', 'suspended', 'terminated']),
      coveragePercentage: z
        .number()
        .int()
        .min(0, 'Le pourcentage de couverture doit être entre 0 et 100')
        .max(100, 'Le pourcentage de couverture doit être entre 0 et 100'),
      sessionPriceCents: z.number().int().min(100, 'Le prix de séance doit être au moins 1 DH'),
      coPayRule: z.enum(['fixed', 'percentage']),
      coPayAmountCents: z.number().int().min(0, 'Le montant de co-paiement doit être positif').optional(),
      coPayPercentage: z
        .number()
        .int()
        .min(0, 'Le pourcentage de co-paiement doit être entre 0 et 100')
        .max(100, 'Le pourcentage de co-paiement doit être entre 0 et 100')
        .optional(),
      notes: z.string().optional()
    })
    .refine(
      (data) => {
        if (data.coPayRule === 'fixed' && data.coPayAmountCents === undefined) return false
        if (data.coPayRule === 'percentage' && data.coPayPercentage === undefined) return false
        return true
      },
      {
        message: 'Le montant ou le pourcentage de co-paiement est requis selon la règle choisie',
        path: ['coPayRule']
      }
    )

  const validate = (state: typeof form): FormError[] => {
    const result = formSchema.safeParse(state)
    if (!result.success) {
      return result.error.issues.map((issue) => ({
        name: issue.path[0] as string,
        message: issue.message
      }))
    }
    return []
  }

  async function onSubmit(event: FormSubmitEvent<typeof form>) {
    isSubmitting.value = true

    try {
      const companyData: InsuranceCompanyCreate = {
        name: event.data.name,
        code: event.data.code,
        status: event.data.status,
        coveragePercentage: event.data.coveragePercentage,
        sessionPriceCents: event.data.sessionPriceCents,
        coPayRule: event.data.coPayRule,
        coPayAmountCents: event.data.coPayAmountCents,
        coPayPercentage: event.data.coPayPercentage,
        notes: event.data.notes
      }

      if (isEdit.value && props.company) {
        await updateInsuranceCompany.mutateAsync({
          companyId: props.company.id,
          companyData,
          onSuccess: () => {
            props.onSuccess?.()
            emit('close')
          }
        })
      } else {
        await createInsuranceCompany.mutateAsync(companyData)
        props.onSuccess?.()
        emit('close')
      }
    } catch (err) {
      console.error('Failed to save insurance company:', err)
    } finally {
      isSubmitting.value = false
    }
  }

  const sessionPriceDh = computed({
    get: () => form.sessionPriceCents / 100,
    set: (value) => {
      form.sessionPriceCents = Math.round(value * 100)
    }
  })

  const coPayAmountDh = computed({
    get: () => ((form.coPayAmountCents ?? undefined) !== undefined ? form.coPayAmountCents! / 100 : undefined),
    set: (value) => {
      form.coPayAmountCents = value !== undefined ? Math.round(value * 100) : undefined
    }
  })

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
  <USlideover
    :title="slideoverTitle"
    :description="slideoverDescription"
    :ui="{ content: 'w-full md:w-1/2 lg:w-1/3 max-w-3xl bg-elevated' }"
    @close="emit('close')"
  >
    <template #body>
      <UForm ref="formRef" :state="form" :validate="validate" @submit="onSubmit">
        <UCard>
          <div class="space-y-4">
            <UFormField label="Nom" name="name" required>
              <UInput v-model="form.name" placeholder="Ex: Wafa Assurance" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Code" name="code" required>
                <UInput v-model="form.code" placeholder="Ex: WAFA" uppercase class="w-full" />
              </UFormField>

              <UFormField label="Statut" name="status">
                <USelect
                  v-model="form.status"
                  :items="[
                    { label: 'Active', value: 'active' },
                    { label: 'Suspendue', value: 'suspended' },
                    { label: 'Terminée', value: 'terminated' }
                  ]"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Prix de séance (DH)" name="sessionPriceCents" required>
                <UInput v-model="sessionPriceDh" type="number" min="1" step="1" class="w-full">
                  <template #trailing>
                    <span class="text-sm">DH</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField label="Couverture (%)" name="coveragePercentage" required>
                <UInput
                  v-model.number="form.coveragePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full"
                >
                  <template #trailing>
                    <span class="text-sm">%</span>
                  </template>
                </UInput>
              </UFormField>
            </div>

            <UFormField label="Règle de co-paiement" name="coPayRule" required>
              <USelect
                v-model="form.coPayRule"
                :items="[
                  { label: 'Montant fixe', value: 'fixed' },
                  { label: 'Pourcentage', value: 'percentage' }
                ]"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="form.coPayRule === 'fixed'"
              label="Montant de co-paiement (DH)"
              name="coPayAmountCents"
              required
            >
              <UInput v-model="coPayAmountDh" type="number" min="0" step="1" class="w-full">
                <template #trailing>
                  <span class="text-sm">DH</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField
              v-if="form.coPayRule === 'percentage'"
              label="Pourcentage de co-paiement"
              name="coPayPercentage"
              required
            >
              <UInput v-model.number="form.coPayPercentage" type="number" min="0" max="100" step="1" class="w-full">
                <template #trailing>
                  <span class="text-sm">%</span>
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Notes" name="notes">
              <UTextarea v-model="form.notes" :rows="3" placeholder="Notes additionnelles..." class="w-full" />
            </UFormField>

            <UPageCard
              v-if="form.sessionPriceCents > 0"
              title="Aperçu du calcul"
              highlight
              highlight-color="warning"
              variant="solid"
            >
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="">Prix de séance:</span>
                  <span class="font-medium">{{ formatCurrency(form.sessionPriceCents) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="">Co-paiement du patient:</span>
                  <span class="font-medium">{{ formatCurrency(calculatedCoPayAmount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="">Paiement de l'assurance:</span>
                  <span class="text-success-600 font-bold">{{ formatCurrency(calculatedInsuranceAmount) }}</span>
                </div>
                <USeparator />
                <div class="flex justify-between">
                  <span class="font-medium">Total:</span>
                  <span class="font-bold">{{ formatCurrency(form.sessionPriceCents) }}</span>
                </div>
              </div>
            </UPageCard>
          </div>
        </UCard>
      </UForm>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton label="Annuler" color="neutral" variant="ghost" @click="close" />
        <UButton label="Enregistrer" :loading="isSubmitting" @click="submitForm" />
      </div>
    </template>
  </USlideover>
</template>
