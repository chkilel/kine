<script setup lang="ts">
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

  const toast = useToast()

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', icon: 'i-lucide-home', to: '/' },
    { label: 'Cabinets', to: '/organizations' },
    { label: 'Profil' }
  ]
  const tabs: TabsItem[] = [
    {
      label: 'Informations Administratives',
      icon: 'i-lucide-building-2',
      slot: 'administrative'
    },
    {
      label: 'Gestion des Salles',
      icon: 'i-lucide-door-open',
      slot: 'rooms'
    },
    {
      label: 'Paramètres avancés',
      icon: 'i-lucide-settings',
      slot: 'advanced'
    }
  ]

  const form = reactive({
    name: 'Clinique Physio Santé SARL',
    slug: 'clinique-physio-sante',
    type: 'clinique',
    description: '',
    address: '15 Avenue de la République',
    postalCode: '75011',
    city: 'Paris',
    sector: '',
    email: 'contact@physiosante.fr',
    phones: [
      { type: 'Fixe', number: '+212 5 00 00 00 00' },
      { type: 'Mobile', number: '+212 6 00 00 00 00' }
    ],
    website: '',
    legalName: '',
    legalTitle: '',
    legalEmail: '',
    legalPhone: '',
    legalId: '',
    ice: '883 291 000 00024',
    rc: 'CASABLANCA 12345',
    if: '',
    license: '',
    legalForm: 'SARL',
    creationDate: '',
    bankName: '',
    iban: '',
    rib: '',
    agency: '',
    accountHolder: '',
    paymentDelay: '30',
    paymentMethod: 'Virement',
    currency: 'MAD (Dirham Marocain)',
    vatRate: 20,
    vatSubject: true
  })

  const typeOptions = [
    { label: 'Cabinet', value: 'cabinet' },
    { label: 'Centre médical', value: 'centre-medical' },
    { label: 'Clinique', value: 'clinique' },
    { label: 'Centre de rééducation', value: 'centre-reeeducation' }
  ]

  const legalFormOptions = [
    { label: 'SARL', value: 'SARL' },
    { label: 'SA', value: 'SA' },
    { label: 'EURL', value: 'EURL' },
    { label: 'Auto-entrepreneur', value: 'auto-entrepreneur' },
    { label: 'Association', value: 'association' }
  ]

  const paymentDelayOptions = [
    { label: 'Immédiat', value: 'immediat' },
    { label: '7 jours', value: '7' },
    { label: '15 jours', value: '15' },
    { label: '30 jours', value: '30' },
    { label: 'Fin de mois', value: 'fin-de-mois' }
  ]

  const paymentMethodOptions = [
    { label: 'Virement', value: 'Virement' },
    { label: 'Chèque', value: 'Chèque' },
    { label: 'Espèces', value: 'Espèces' },
    { label: 'Prélèvement', value: 'Prélèvement' },
    { label: 'CCP', value: 'CCP' }
  ]

  const isSaving = ref(false)

  async function handleSave() {
    isSaving.value = true
    setTimeout(() => {
      isSaving.value = false
      toast.add({
        title: 'Succès',
        description: "Les informations de l'organisation ont été mises à jour",
        color: 'success'
      })
    }, 1000)
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Modifications annulées',
      color: 'neutral'
    })
  }

  function addPhone() {
    form.phones.push({ type: 'Fixe', number: '' })
  }

  function removePhone(index: number) {
    form.phones.splice(index, 1)
  }
</script>

<template>
  <UDashboardPanel id="organization-profile" class="bg-elevated">
    <template #header>
      <UDashboardNavbar title="Cabinet" class="bg-default">
        <template #leading>
          <UDashboardSidebarCollapse />
          <USeparator orientation="vertical" class="h-(--ui-header-height) px-4" />
        </template>
        <template #title>
          <!-- Breadcrumb -->
          <UBreadcrumb :items="breadcrumbItems" />
        </template>

        <template #right>
          <UChip inset size="xl">
            <UButton icon="i-lucide-bell" color="neutral" variant="soft" class="rounded-full" />
          </UChip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h1 class="text-highlighted text-3xl font-bold tracking-tight lg:text-4xl">Profil Organisation</h1>
              <div class="flex gap-3">
                <UButton label="Annuler" color="neutral" variant="outline" :disabled="isSaving" @click="handleCancel" />
                <UButton
                  label="Enregistrer"
                  icon="i-lucide-save"
                  :loading="isSaving"
                  :disabled="isSaving"
                  @click="handleSave"
                />
              </div>
            </div>
          </div>

          <AppCard variant="outline">
            <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div class="mx-auto shrink-0 sm:mx-0">
                <UAvatar icon="i-lucide-building-2" alt="Clinique Physio Santé" class="size-24 rounded-xl text-4xl" />
              </div>
              <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
                <div class="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-start">
                  <h1 class="text-2xl leading-tight font-bold md:text-3xl">Clinique Physio Santé</h1>
                  <UBadge color="success" size="lg" variant="subtle" class="self-center rounded-full uppercase">
                    Active
                  </UBadge>
                </div>
                <div
                  class="text-muted flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm sm:justify-start"
                >
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-hash" class="text-base" />
                    <span>ORG-8832</span>
                  </div>

                  <span>•</span>

                  <div>Dernière modification: 12 Oct 2025</div>
                </div>
              </div>
            </div>
          </AppCard>

          <UTabs :items="tabs" color="primary" variant="link" class="w-full">
            <template #administrative>
              <div class="grid grid-cols-1 items-start gap-x-12 gap-y-6 pt-6 lg:grid-cols-2">
                <div class="flex w-full flex-col gap-6">
                  <AppCard variant="outline" title="Identité de l'établissement">
                    <div class="flex flex-col gap-y-4">
                      <UFormField label="Nom de l'établissement">
                        <UInput v-model="form.name" class="w-full" />
                      </UFormField>
                      <UFormField label="Identifiant/Slug">
                        <UInput v-model="form.slug" class="w-full" disabled />
                      </UFormField>
                      <UFormField label="Type d'établissement">
                        <USelect v-model="form.type" :items="typeOptions" class="w-full" />
                      </UFormField>
                      <UFormField label="Description/Activités">
                        <UTextarea
                          v-model="form.description"
                          placeholder="Brève description des activités de la clinique..."
                          :rows="4"
                          class="w-full"
                        />
                      </UFormField>
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Coordonnées">
                    <div class="flex flex-col gap-y-4">
                      <div>
                        <UFormField label="Adresse complète">
                          <UTextarea v-model="form.address" :rows="3" class="w-full" />
                        </UFormField>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <UFormField label="Code postal">
                            <UInput v-model="form.postalCode" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Ville">
                            <UInput v-model="form.city" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div>
                        <UFormField label="Quartier/Secteur">
                          <UInput v-model="form.sector" placeholder="Ex: Centre-ville" class="w-full" />
                        </UFormField>
                      </div>
                      <div>
                        <UFormField label="Email général">
                          <UInput v-model="form.email" type="email" icon="i-lucide-mail" class="w-full" />
                        </UFormField>
                      </div>
                      <UFormField label="Numéros de téléphone" :ui="{ container: 'grid gap-y-2' }">
                        <div v-for="(phone, index) in form.phones" :key="index" class="flex items-center gap-2">
                          <UFieldGroup class="w-full">
                            <USelect v-model="phone.type" :items="['Fixe', 'Bureau']" class="w-28" />
                            <UInput v-model="phone.number" class="flex-1" />
                            <UButton
                              icon="i-lucide-trash-2"
                              color="error"
                              variant="subtle"
                              size="sm"
                              square
                              @click="removePhone(index)"
                            />
                          </UFieldGroup>
                        </div>
                        <UButton
                          label="Ajouter un numéro"
                          icon="i-lucide-plus"
                          color="primary"
                          variant="ghost"
                          class="mt-1 w-fit"
                          @click="addPhone"
                        />
                      </UFormField>
                      <div>
                        <UFormField label="Site web">
                          <UFieldGroup class="w-full">
                            <UBadge color="neutral" variant="outline" size="lg" label="https://" />

                            <UInput
                              v-model="form.website"
                              placeholder="www.example.com"
                              type="url"
                              trailing-icon="i-lucide-globe"
                              class="w-full"
                            />
                          </UFieldGroup>
                        </UFormField>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Responsable légal">
                    <div class="flex flex-col gap-y-4">
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Nom complet">
                            <UInput v-model="form.legalName" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Titre/Profession">
                            <UInput v-model="form.legalTitle" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Email professionnel">
                            <UInput v-model="form.legalEmail" icon="i-lucide-mail" type="email" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Tél. professionnel">
                            <UInput v-model="form.legalPhone" icon="i-lucide-phone" type="tel" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div>
                        <UFormField label="CNI / CNIE (Optionnel)">
                          <UInput v-model="form.legalId" icon="i-lucide-id-card" class="w-full" />
                        </UFormField>
                      </div>
                    </div>
                  </AppCard>
                </div>

                <div class="flex w-full flex-col gap-6">
                  <AppCard variant="outline" title="Branding">
                    <div
                      class="border-border hover:bg-elevated/50 group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
                    >
                      <div
                        class="bg-default border-border flex size-20 items-center justify-center overflow-hidden rounded-full border shadow-sm"
                      >
                        <UIcon name="i-lucide-building" class="text-muted size-8" />
                      </div>
                      <div>
                        <p class="text-highlighted group-hover:text-primary text-sm font-bold transition-colors">
                          Logo de l'organisation
                        </p>
                        <p class="text-muted mt-1 text-xs">PNG, JPG ou SVG (Max 2MB)</p>
                      </div>
                      <UButton label="Changer l'image" color="neutral" variant="outline" size="sm" />
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Localisation">
                    <div class="flex flex-col gap-y-4">
                      <div>
                        <UFormField label="Adresse complète">
                          <p class="bg-elevated/60 text-highlighted/70 w-full rounded-md px-4 py-3 text-sm">
                            {{ form.address }}
                          </p>
                        </UFormField>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <UFormField label="Code postal">
                            <UInput v-model="form.postalCode" disabled class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Ville">
                            <UInput v-model="form.city" disabled class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div>
                        <UFormField label="Quartier/Secteur">
                          <UInput v-model="form.sector" placeholder="Ex: Centre-ville" disabled class="w-full" />
                        </UFormField>
                      </div>
                      <div
                        class="bg-elevated border-border group relative mt-2 h-32 w-full cursor-pointer overflow-hidden rounded-xl border"
                      >
                        <div class="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/10" />
                        <div
                          class="bg-default/90 text-highlighted border-border absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur"
                        >
                          <UIcon name="i-lucide-map" class="size-3.5" />
                          <span>Voir sur la carte</span>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Identifiants fiscaux et juridiques">
                    <div class="flex flex-col gap-y-4">
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="ICE">
                            <UInput v-model="form.ice" placeholder="15 chiffres" class="w-full font-mono" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="RC">
                            <UInput v-model="form.rc" placeholder="VILLE 12345" class="w-full uppercase" />
                          </UFormField>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="IF">
                            <UInput v-model="form.if" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Patente/Licence">
                            <UInput v-model="form.license" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Forme juridique">
                            <USelect v-model="form.legalForm" :items="legalFormOptions" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Date de création">
                            <UInput v-model="form.creationDate" type="date" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Coordonnées bancaires">
                    <div class="flex flex-col gap-y-4">
                      <div>
                        <UFormField label="Nom de la banque">
                          <UInput v-model="form.bankName" class="w-full" />
                        </UFormField>
                      </div>
                      <div>
                        <UFormField label="IBAN">
                          <UInput v-model="form.iban" class="w-full font-mono" />
                        </UFormField>
                      </div>
                      <div>
                        <UFormField label="RIB (24 Chiffres)">
                          <UInput v-model="form.rib" class="w-full font-mono" maxlength="24" />
                        </UFormField>
                      </div>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Agence (Optionnel)">
                            <UInput v-model="form.agency" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Titulaire du compte">
                            <UInput v-model="form.accountHolder" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard variant="outline" title="Conditions de facturation">
                    <div class="flex flex-col gap-y-4">
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Délai de paiement">
                            <USelect v-model="form.paymentDelay" :items="paymentDelayOptions" class="w-full" />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Mode de paiement">
                            <USelect v-model="form.paymentMethod" :items="paymentMethodOptions" class="w-full" />
                          </UFormField>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
                        <div>
                          <UFormField label="Devise">
                            <UInput
                              v-model="form.currency"
                              disabled
                              class="bg-elevated/60 text-highlighted/70 w-full text-sm"
                            />
                          </UFormField>
                        </div>
                        <div>
                          <UFormField label="Taux de TVA">
                            <UInput
                              v-model="form.vatRate"
                              type="number"
                              icon="i-lucide-percent"
                              class="w-full text-right"
                            />
                          </UFormField>
                        </div>
                      </div>
                      <div
                        class="bg-elevated/50 border-border mt-2 flex items-center justify-between rounded-md border p-4"
                      >
                        <span class="text-highlighted text-sm font-bold">Assujettissement TVA</span>
                        <USwitch v-model="form.vatSubject" />
                      </div>
                    </div>
                  </AppCard>
                </div>
              </div>
            </template>

            <template #rooms>
              <UCard variant="soft">
                <div class="flex flex-col items-center justify-center p-12">
                  <UIcon name="i-lucide-door-open" class="text-muted mb-4 size-16" />
                  <h3 class="text-highlighted mb-2 text-xl font-bold">Gestion des Salles</h3>
                  <p class="text-muted text-center">Cette fonctionnalité sera bientôt disponible.</p>
                </div>
              </UCard>
            </template>

            <template #advanced>
              <UCard variant="soft">
                <div class="flex flex-col items-center justify-center p-12">
                  <UIcon name="i-lucide-settings" class="text-muted mb-4 size-16" />
                  <h3 class="text-highlighted mb-2 text-xl font-bold">Paramètres avancés</h3>
                  <p class="text-muted text-center">Cette fonctionnalité sera bientôt disponible.</p>
                </div>
              </UCard>
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
