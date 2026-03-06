<script setup lang="ts">
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'

  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const defaultForm = (org?: Organization) => ({
    fiscal: {
      ice: org?.fiscal?.ice ?? '',
      rc: org?.fiscal?.rc ?? '',
      if: org?.fiscal?.if ?? '',
      license: org?.fiscal?.license ?? '',
      legalForm: org?.fiscal?.legalForm ?? 'liberal-profession',
      creationDate: org?.fiscal?.creationDate ?? '',
      vatRate: org?.fiscal?.vatRate ?? 20,
      vatSubject: org?.fiscal?.vatSubject ?? true,
      paymentDelay: org?.fiscal?.paymentDelay ?? '30',
      paymentMethod: org?.fiscal?.paymentMethod ?? 'cash',
      currency: org?.fiscal?.currency ?? 'MAD (Dirham Marocain)'
    },
    banking: {
      bankName: org?.banking?.bankName ?? '',
      iban: org?.banking?.iban ?? '',
      rib: org?.banking?.rib ?? '',
      agency: org?.banking?.agency ?? '',
      accountHolder: org?.banking?.accountHolder ?? ''
    }
  })

  const state = reactive<OrgLegal>(defaultForm())

  watch(
    organization,
    (org) => {
      if (!org) return
      Object.assign(state, defaultForm(org))
    },
    { immediate: true }
  )

  const df = new DateFormatter('fr-FR', {
    dateStyle: 'medium'
  })

  const creationDateModel = computed({
    get: () => (state.fiscal?.creationDate ? parseDate(state.fiscal.creationDate) : null),
    set: (val) => {
      if (val) state.fiscal.creationDate = val.toString()
    }
  })

  const updateOrganization = useUpdateOrganization()
  const toast = useToast()
  const isSaving = computed(() => updateOrganization.isLoading.value)
  const form = useTemplateRef('form')

  function onSubmit(event: FormSubmitEvent<OrgLegal>) {
    const organizationId = route.params.id as string
    updateOrganization.mutate({
      organizationId,
      organizationData: event.data
    })
  }

  function handleCancel() {
    if (organization.value) {
      Object.assign(state, defaultForm(organization.value))
      toast.add({
        title: 'Annulation',
        description: 'Modifications annulées',
        color: 'neutral'
      })
    }
  }

  defineExpose({
    handleSave: () => form.value?.submit(),
    handleCancel,
    isSaving
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <UForm
    v-else
    ref="form"
    :state="state"
    :schema="orgLegalSchema"
    class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2"
    @submit="onSubmit"
  >
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Identifiants fiscaux et juridiques">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="ICE" name="fiscal.ice">
                <UInput v-model="state.fiscal.ice" placeholder="15 chiffres" class="w-full font-mono" />
              </UFormField>
            </div>
            <div>
              <UFormField label="RC" name="fiscal.rc">
                <UInput v-model="state.fiscal.rc" placeholder="VILLE 12345" class="w-full uppercase" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="IF" name="fiscal.if">
                <UInput v-model="state.fiscal.if" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Patente/Licence" name="fiscal.license">
                <UInput v-model="state.fiscal.license" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Forme juridique" name="fiscal.legalForm">
                <USelect v-model="state.fiscal.legalForm" :items="LEGAL_FORM_OPTIONS" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Date de création" name="fiscal.creationDate">
                <UPopover>
                  <UButton color="neutral" variant="outline" icon="i-lucide-calendar" class="w-full justify-start">
                    {{
                      creationDateModel
                        ? df.format(creationDateModel.toDate(getLocalTimeZone()))
                        : 'Sélectionner une date'
                    }}
                  </UButton>

                  <template #content>
                    <UCalendar v-model="creationDateModel" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Coordonnées bancaires">
        <div class="flex flex-col gap-y-4">
          <div>
            <UFormField label="Nom de la banque" name="banking.bankName">
              <UInput v-model="state.banking.bankName" class="w-full" />
            </UFormField>
          </div>
          <div>
            <UFormField label="IBAN" name="banking.iban">
              <UInput v-model="state.banking.iban" class="w-full font-mono" />
            </UFormField>
          </div>
          <div>
            <UFormField label="RIB (24 Chiffres)" name="banking.rib">
              <UInput v-model="state.banking.rib" class="w-full font-mono" maxlength="24" />
            </UFormField>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Agence (Optionnel)" name="banking.agency">
                <UInput v-model="state.banking.agency" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Titulaire du compte" name="banking.accountHolder">
                <UInput v-model="state.banking.accountHolder" class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Conditions de facturation">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Délai de paiement" name="fiscal.paymentDelay">
                <USelect v-model="state.fiscal.paymentDelay" :items="PAYMENT_DELAY_OPTIONS" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Mode de paiement" name="fiscal.paymentMethod">
                <USelect v-model="state.fiscal.paymentMethod" :items="PAYMENT_METHOD_OPTIONS" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Devise" name="fiscal.currency">
                <UInput
                  v-model="state.fiscal.currency"
                  disabled
                  class="bg-elevated/60 text-highlighted/70 w-full text-sm"
                />
              </UFormField>
            </div>
            <div>
              <UFormField label="Taux de TVA" name="fiscal.vatRate">
                <UInput
                  v-model.number="state.fiscal.vatRate"
                  type="number"
                  icon="i-lucide-percent"
                  class="w-full text-right"
                />
              </UFormField>
            </div>
          </div>
          <div class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Assujettissement TVA</span>
            <UFormField name="fiscal.vatSubject">
              <USwitch v-model="state.fiscal.vatSubject" />
            </UFormField>
          </div>
        </div>
      </AppCard>

      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon
          :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-scale'"
          :class="['size-16', isSaving ? 'text-primary animate-spin' : 'text-muted']"
        />
        <div>
          <p class="text-highlighted text-sm font-bold">
            {{ isSaving ? 'Enregistrement en cours…' : 'Informations légales à jour' }}
          </p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>
    </div>
  </UForm>
</template>
