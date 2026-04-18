<script setup lang="ts">
  import type { BreadcrumbItem } from '@nuxt/ui'

  // ─── Props / Slots ───────────────────────────────────────────
  defineProps<{
    id: string // Unique ID for the dashboard panel
    title?: string //Page title for the header
    breadcrumbs?: BreadcrumbItem[] // Breadcrumb items (optional, shows title if not provided)
    showNotifications?: boolean // Show notification bell in header - @default true
  }>()

  const slots = defineSlots<{
    default: () => any
    footer?: () => any
    'header-leading'?: () => any
    'header-title'?: () => any
    'header-right'?: () => any
  }>()

  // ─── State ──────────────────────────────────────────────────
  const rightOpen = useState('rightSide')
</script>

<template>
  <UDashboardPanel :id="id" class="bg-muted">
    <template #header>
      <UDashboardNavbar
        :title="title"
        class=""
        :ui="{
          root: 'bg-default justify-start',
          right: 'ml-auto flex items-center shrink-0 gap-1.5',
          left: 'flex-1'
        }"
      >
        <template #leading>
          <slot name="header-leading">
            <UDashboardSidebarCollapse variant="soft" />
            <PatientSearchModal />
          </slot>
        </template>

        <template v-if="slots['header-title']" #title>
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

          <UButton
            icon="i-lucide-panel-left"
            color="neutral"
            variant="ghost"
            :aria-label="rightOpen ? 'Close sidebar' : 'Open sidebar'"
            @click="rightOpen = !rightOpen"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <slot />
      </div>
    </template>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDashboardPanel>
</template>
