<script setup lang="ts">
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

  const { orgPath } = await useOrgRoute()

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Accueil', icon: 'i-lucide-home', to: orgPath('/') },
    { label: 'Cabinets', to: '/organizations' },
    { label: 'Profil' }
  ]

  const tabs: TabsItem[] = [
    { label: 'Informations générales', icon: 'i-lucide-building-2', slot: 'general', value: 'general' },
    { label: 'Informations légales', icon: 'i-lucide-scale', slot: 'legal', value: 'legal' },
    { label: 'Tarifs & Réservations', icon: 'i-lucide-calendar-clock', slot: 'pricing', value: 'pricing' },
    { label: 'Configuration clinique', icon: 'i-lucide-stethoscope', slot: 'clinical', value: 'clinical' },
    { label: 'Apparence', icon: 'i-lucide-palette', slot: 'appearance', value: 'appearance' },
    { label: 'Avancé', icon: 'i-lucide-cog', slot: 'advanced', value: 'advanced' },
    { label: 'Gestion des Salles', icon: 'i-lucide-door-open', slot: 'rooms', value: 'rooms' }
  ]

  const route = useRoute()
  const router = useRouter()
  const { data: organization, isLoading: isPending } = useFullOrganization(() => route.params.id as string)

  const activeTab = computed({
    get() {
      const tabFromQuery = route.query.tab as string
      const validTabs = ['general', 'legal', 'pricing', 'clinical', 'appearance', 'advanced', 'rooms']
      return validTabs.includes(tabFromQuery) ? tabFromQuery : 'general'
    },
    set(tab) {
      router.push({
        path: route.path,
        query: { ...route.query, tab }
      })
    }
  })

  const toast = useToast()
  const isSaving = computed(() => {
    const tabRef = tabRefMap[activeTab.value as keyof typeof tabRefMap]
    return tabRef?.value?.isSaving ?? false
  })

  type ChildExposedType = { handleSave: () => Promise<void>; handleCancel: () => Promise<void>; isSaving: Ref<boolean> }
  const generalesTabRef = ref<ChildExposedType | null>(null)
  const legalesTabRef = ref<ChildExposedType | null>(null)
  const tarifsTabRef = ref<ChildExposedType | null>(null)
  const cliniqueTabRef = ref<ChildExposedType | null>(null)
  const apparenceTabRef = ref<ChildExposedType | null>(null)
  const avanceTabRef = ref<ChildExposedType | null>(null)

  const tabRefMap = {
    general: generalesTabRef,
    legal: legalesTabRef,
    pricing: tarifsTabRef,
    clinical: cliniqueTabRef,
    appearance: apparenceTabRef,
    advanced: avanceTabRef
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
    const tabRef = tabRefMap[activeTab.value as keyof typeof tabRefMap]
    if (tabRef && tabRef.value && 'handleCancel' in tabRef.value) {
      tabRef.value.handleCancel()
    } else {
      toast.add({
        title: 'Annulation',
        description: "Cet onglet ne supporte pas l'annulation",
        color: 'neutral'
      })
    }
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

    <UTabs v-model="activeTab" :items="tabs" color="primary" variant="link" default-value="general" class="w-full">
      <template #general>
        <OrganizationGeneralInformationTab ref="generalesTabRef" />
      </template>

      <template #legal>
        <OrganizationLegalInformationTab ref="legalesTabRef" />
      </template>

      <template #pricing>
        <OrganizationPricingReservationsTab ref="tarifsTabRef" />
      </template>

      <template #clinical>
        <OrganizationClinicalConfigurationTab ref="cliniqueTabRef" />
      </template>

      <template #appearance>
        <OrganizationAppearanceTab ref="apparenceTabRef" />
      </template>

      <template #advanced>
        <OrganizationAdvancedTab ref="avanceTabRef" />
      </template>

      <template #rooms>
        <OrganizationRoomsTab />
      </template>
    </UTabs>

    <template v-if="['general', 'legal', 'pricing', 'clinical', 'appearance', 'advanced'].includes(activeTab)" #footer>
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
