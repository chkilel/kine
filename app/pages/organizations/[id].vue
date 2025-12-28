<script setup lang="ts">
  import type { BreadcrumbItem, TabsItem } from '@nuxt/ui'

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

  const isSaving = ref(false)
  const toast = useToast()

  function handleSave() {
    toast.add({
      title: 'Enregistrement',
      description: 'Veuillez utiliser les contrôles dans l\'onglet "Informations Administratives"',
      color: 'neutral'
    })
  }

  function handleCancel() {
    toast.add({
      title: 'Annulation',
      description: 'Veuillez utiliser les contrôles dans l\'onglet "Informations Administratives"',
      color: 'neutral'
    })
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
              <OrganizationProfileAdministrativeTab />
            </template>

            <template #rooms>
              <OrganizationProfileRoomsTab />
            </template>

            <template #advanced>
              <OrganizationProfileAdvancedTab />
            </template>
          </UTabs>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
