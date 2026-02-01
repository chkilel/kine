<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'

  defineProps<{
    /**
     * Unique ID for the dashboard panel
     */
    id: string
    /**
     * Page title for the header
     */
    title?: string
    /**
     * Breadcrumb items (optional, shows title if not provided)
     */
    breadcrumbs?: BreadcrumbItem[]
    /**
     * Show notification bell in header
     * @default true
     */
    showNotifications?: boolean
  }>()

  defineSlots<{
    default: () => any
    footer?: () => any
    'header-leading'?: () => any
    'header-title'?: () => any
    'header-right'?: () => any
  }>()
</script>

<template>
  <UDashboardPanel :id="id" class="bg-elevated">
    <template #header>
      <UDashboardNavbar :title="title" class="bg-default">
        <template #leading>
          <slot name="header-leading">
            <UDashboardSidebarCollapse variant="soft" />
          </slot>
        </template>

        <template #title>
          <slot name="header-title">
            <div class="flex items-center">
              <h1 v-if="title" class="font-semibold">{{ title }}</h1>
              <template v-if="breadcrumbs">
                <USeparator orientation="vertical" class="h-(--ui-header-height) px-4" />
                <UBreadcrumb :items="breadcrumbs" />
              </template>
            </div>
          </slot>
        </template>

        <template #right>
          <slot name="header-right">
            <template v-if="showNotifications !== false">
              <UChip inset size="xl">
                <UButton icon="i-lucide-bell" color="neutral" variant="soft" class="rounded-full" />
              </UChip>
            </template>
          </slot>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6">
          <slot />
        </div>
      </UContainer>
    </template>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDashboardPanel>
</template>
