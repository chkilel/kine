<script setup lang="ts">
  import { sub } from 'date-fns'
  import type { DropdownMenuItem } from '@nuxt/ui'
  import type { Period, Range } from '~/types'

  const { isNotificationsSlideoverOpen } = useDashboard()

  const items = [
    [
      {
        label: 'New mail',
        icon: 'i-lucide-send',
        to: '/inbox'
      },
      {
        label: 'New patient',
        icon: 'i-lucide-user-plus',
        to: '/patients'
      }
    ]
  ] satisfies DropdownMenuItem[][]

  const range = shallowRef<Range>({
    start: sub(new Date(), { days: 14 }),
    end: new Date()
  })
  const period = ref<Period>('daily')
</script>

<template>
  <AppDashboardPage id="home" title="Home">
    <template #header-right>
      <UDropdownMenu :items="items">
        <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
      </UDropdownMenu>
    </template>

    <UDashboardToolbar class="-mt-6">
      <template #left>
        <HomeDateRangePicker v-model="range" />
        <HomePeriodSelect v-model="period" :range="range" />
      </template>
    </UDashboardToolbar>

    <HomeStats :period="period" :range="range" />
    <HomeChart :period="period" :range="range" />
    <HomeSales :period="period" :range="range" />
  </AppDashboardPage>
</template>
