<script setup lang="ts">
  const route = useRoute()
  const { data: organization, isPending } = useFullOrganization(() => route.params.id as string)

  const fiscal = reactive({
    ice: '',
    rc: '',
    if: '',
    license: '',
    legalForm: 'liberal-profession',
    creationDate: '',
    vatRate: 20,
    vatSubject: true,
    paymentDelay: '30',
    paymentMethod: 'cash',
    currency: 'MAD (Dirham Marocain)'
  })

  const banking = reactive({
    bankName: '',
    iban: '',
    rib: '',
    agency: '',
    accountHolder: ''
  })

  watchEffect(() => {
    if (organization.value) {
      Object.assign(
        fiscal,
        organization.value.fiscal || {
          ice: '',
          rc: '',
          if: '',
          license: '',
          legalForm: 'liberal-profession',
          creationDate: '',
          vatRate: 20,
          vatSubject: true,
          paymentDelay: '30',
          paymentMethod: 'cash',
          currency: 'MAD (Dirham Marocain)'
        }
      )
      Object.assign(
        banking,
        organization.value.banking || { bankName: '', iban: '', rib: '', agency: '', accountHolder: '' }
      )
    }
  })

  const legalFormOptions = [
    { label: 'Profession libérale', value: 'liberal-profession' },
    { label: 'Société civile', value: 'civil-company' },
    { label: 'Société commerciale', value: 'commercial-company' },
    { label: 'Autre', value: 'other' }
  ]

  const paymentDelayOptions = [
    { label: 'Immédiat', value: 'immediate' },
    { label: '7 jours', value: '7' },
    { label: '15 jours', value: '15' },
    { label: '30 jours', value: '30' },
    { label: 'Fin de mois', value: 'end-of-month' }
  ]

  const paymentMethodOptions = [
    { label: 'Espèces', value: 'cash' },
    { label: 'Carte bancaire', value: 'bank-card' },
    { label: 'Chèque', value: 'check' },
    { label: 'Virement', value: 'wire-transfer' }
  ]

  const isSaving = ref(false)
  const toast = useToast()

  async function handleSave() {
    isSaving.value = true

    try {
      const organizationId = route.params.id as string

      const formData = {
        fiscal: toRaw(fiscal),
        banking: toRaw(banking)
      }

      const result = updateOrganizationSchema.safeParse(formData)

      if (!result.success) {
        const errors = result.error.issues
        const firstError = errors[0]
        if (firstError) {
          toast.add({
            title: 'Erreur de validation',
            description: firstError.message,
            color: 'error'
          })
        }
        isSaving.value = false
        return
      }

      await authClient.organization.update({
        organizationId,
        data: formData
      })

      toast.add({
        title: 'Succès',
        description: 'Les informations légales ont été mises à jour',
        color: 'success'
      })
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.add({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de la mise à jour",
        color: 'error'
      })
    } finally {
      isSaving.value = false
    }
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Modifications annulées',
      color: 'neutral'
    })
  }

  defineExpose({
    handleSave
  })
</script>

<template>
  <div v-if="isPending" class="flex items-center justify-center py-12">
    <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
  </div>
  <div v-else class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2">
    <div class="flex w-full flex-col gap-6">
      <AppCard variant="outline" title="Identifiants fiscaux et juridiques">
        <div class="flex flex-col gap-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="ICE">
                <UInput v-model="fiscal.ice" placeholder="15 chiffres" class="w-full font-mono" />
              </UFormField>
            </div>
            <div>
              <UFormField label="RC">
                <UInput v-model="fiscal.rc" placeholder="VILLE 12345" class="w-full uppercase" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="IF">
                <UInput v-model="fiscal.if" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Patente/Licence">
                <UInput v-model="fiscal.license" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Forme juridique">
                <USelect v-model="fiscal.legalForm" :items="legalFormOptions" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Date de création">
                <UInput v-model="fiscal.creationDate" type="date" class="w-full" />
              </UFormField>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard variant="outline" title="Coordonnées bancaires">
        <div class="flex flex-col gap-y-4">
          <div>
            <UFormField label="Nom de la banque">
              <UInput v-model="banking.bankName" class="w-full" />
            </UFormField>
          </div>
          <div>
            <UFormField label="IBAN">
              <UInput v-model="banking.iban" class="w-full font-mono" />
            </UFormField>
          </div>
          <div>
            <UFormField label="RIB (24 Chiffres)">
              <UInput v-model="banking.rib" class="w-full font-mono" maxlength="24" />
            </UFormField>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Agence (Optionnel)">
                <UInput v-model="banking.agency" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Titulaire du compte">
                <UInput v-model="banking.accountHolder" class="w-full" />
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
              <UFormField label="Délai de paiement">
                <USelect v-model="fiscal.paymentDelay" :items="paymentDelayOptions" class="w-full" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Mode de paiement">
                <USelect v-model="fiscal.paymentMethod" :items="paymentMethodOptions" class="w-full" />
              </UFormField>
            </div>
          </div>
          <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <div>
              <UFormField label="Devise">
                <UInput v-model="fiscal.currency" disabled class="bg-elevated/60 text-highlighted/70 w-full text-sm" />
              </UFormField>
            </div>
            <div>
              <UFormField label="Taux de TVA">
                <UInput v-model="fiscal.vatRate" type="number" icon="i-lucide-percent" class="w-full text-right" />
              </UFormField>
            </div>
          </div>
          <div class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4">
            <span class="text-highlighted text-sm font-bold">Assujettissement TVA</span>
            <USwitch v-model="fiscal.vatSubject" />
          </div>
        </div>
      </AppCard>

      <div
        class="bg-elevated/50 border-border flex flex-col items-center justify-center gap-4 rounded-xl border p-12 text-center"
      >
        <UIcon name="i-lucide-scale" class="text-muted size-16" />
        <div>
          <p class="text-highlighted text-sm font-bold">Informations légales à jour</p>
          <p class="text-muted mt-2 text-xs">
            Les modifications seront enregistrées après avoir cliqué sur le bouton Enregistrer.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
