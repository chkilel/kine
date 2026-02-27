<script setup lang="ts">
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', icon: 'i-lucide-home', to: '/' },
    { label: 'Cabinets', to: '/organizations' },
    { label: 'Profil' }
  ]

  const tabs: TabsItem[] = [
    {
      label: 'Informations générales',
      icon: 'i-lucide-building-2',
      slot: 'generales',
      value: 'generales'
    },
    {
      label: 'Informations légales',
      icon: 'i-lucide-scale',
      slot: 'legales',
      value: 'legales'
    },
    {
      label: 'Tarifs & Réservations',
      icon: 'i-lucide-calendar-clock',
      slot: 'tarifs',
      value: 'tarifs'
    },
    {
      label: 'Configuration clinique',
      icon: 'i-lucide-stethoscope',
      slot: 'clinique',
      value: 'clinique'
    },
    {
      label: 'Apparence',
      icon: 'i-lucide-palette',
      slot: 'apparence',
      value: 'apparence'
    },
    {
      label: 'Avancé',
      icon: 'i-lucide-cog',
      slot: 'avance',
      value: 'avance'
    },
    {
      label: 'Gestion des Salles',
      icon: 'i-lucide-door-open',
      slot: 'rooms',
      value: 'rooms'
    }
  ]

  type FormData = {
    name: string
    slug: string
    type: string
    description: string
    contact: { email: string; website: string; phones: PhoneEntry[] }
    address: { street: string; postalCode: string; city: string; sector: string; country: string }
    legalRepresentative: { name: string; title: string; email: string; phone: string; idNumber: string }
  }

  const route = useRoute()
  const { data: organization, isLoading: isPending } = useFullOrganization(() => route.params.id as string)

  const generalesFormData = ref<FormData>({
    name: '',
    slug: '',
    type: '',
    description: '',
    contact: { email: '', website: '', phones: [] },
    address: { street: '', postalCode: '', city: '', sector: '', country: '' },
    legalRepresentative: { name: '', title: '', email: '', phone: '', idNumber: '' }
  })

  const router = useRouter()

  const activeTab = computed({
    get() {
      const tabFromQuery = route.query.tab as string
      const validTabs = ['generales', 'legales', 'tarifs', 'clinique', 'apparence', 'avance', 'rooms']
      return validTabs.includes(tabFromQuery) ? tabFromQuery : 'generales'
    },
    set(tab) {
      router.push({
        path: route.path,
        query: { ...route.query, tab }
      })
    }
  })

  const isSaving = ref(false)
  const toast = useToast()

  const generalesTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)
  const legalesTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)
  const tarifsTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)
  const cliniqueTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)
  const apparenceTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)
  const avanceTabRef = ref<{ handleSave: () => Promise<void> } | null>(null)

  const tabRefMap = {
    generales: generalesTabRef,
    legales: legalesTabRef,
    tarifs: tarifsTabRef,
    clinique: cliniqueTabRef,
    apparence: apparenceTabRef,
    avance: avanceTabRef
  } as const

  async function handleSave() {
    const tabRef = tabRefMap[activeTab.value as keyof typeof tabRefMap]
    if (tabRef && tabRef.value) {
      await tabRef.value.handleSave()
    } else {
      toast.add({
        title: 'Enregistrement',
        description: "Cet onglet ne supporte pas l'enregistrement",
        color: 'neutral'
      })
    }
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Modifications annulées',
      color: 'neutral'
    })
  }
</script>

<template>
  <AppDashboardPage id="organization-profile" title="Cabinet" :breadcrumbs="breadcrumbItems">
    <AppCard variant="soft">
      <div v-if="isPending" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="text-muted size-8 animate-spin" />
      </div>
      <div v-else-if="organization" class="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div class="mx-auto shrink-0 sm:mx-0">
          <UAvatar icon="i-lucide-building-2" :alt="organization.name" class="size-24 bg-blue-100 text-4xl" />
        </div>
        <div class="flex flex-1 flex-col gap-3 text-center sm:text-left">
          <div class="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <h1 class="text-2xl leading-tight font-bold md:text-3xl">{{ organization.name }}</h1>
            <UBadge
              :color="organization.status === 'active' ? 'success' : 'neutral'"
              size="lg"
              variant="subtle"
              class="self-center rounded-full uppercase"
            >
              {{ organization.status === 'active' ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>
          <div class="text-muted flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm sm:justify-start">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-hash" class="text-base" />
              <span>{{ organization.slug }}</span>
            </div>

            <span>•</span>

            <div>Créé le: {{ new Date(organization.createdAt).toLocaleDateString('fr-FR') }}</div>
          </div>
        </div>
      </div>

      <div class="flex gap-3"></div>
    </AppCard>

    <UTabs v-model="activeTab" :items="tabs" color="primary" variant="link" default-value="generales" class="w-full">
      <template #generales>
        <OrganizationInformationsGeneralesTab ref="generalesTabRef" v-model="generalesFormData" />
      </template>

      <template #legales>
        <OrganizationInformationsLegalesTab ref="legalesTabRef" />
      </template>

      <template #tarifs>
        <OrganizationTarifsReservationsTab ref="tarifsTabRef" />
      </template>

      <template #clinique>
        <OrganizationConfigurationCliniqueTab ref="cliniqueTabRef" />
      </template>

      <template #apparence>
        <OrganizationApparenceTab ref="apparenceTabRef" />
      </template>

      <template #avance>
        <OrganizationAvanceTab ref="avanceTabRef" />
      </template>

      <template #rooms>
        <OrganizationRoomsTab />
      </template>
    </UTabs>

    <template v-if="['generales', 'legales', 'tarifs', 'clinique', 'apparence', 'avance'].includes(activeTab)" #footer>
      <div class="bg-default py-2 backdrop-blur-sm">
        <UContainer>
          <div class="flex items-center justify-end gap-3">
            <UButton
              label="Annuler les changement"
              color="neutral"
              variant="outline"
              :disabled="isSaving"
              @click="handleCancel"
            />
            <UButton
              label="Enregistrer les modifications"
              icon="i-lucide-save"
              :loading="isSaving"
              :disabled="isSaving"
              @click="handleSave"
            />
          </div>
        </UContainer>
      </div>
    </template>
  </AppDashboardPage>
</template>
