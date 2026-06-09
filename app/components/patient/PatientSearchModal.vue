<script setup lang="ts">
  const searchOpen = defineModel<boolean>('open', { default: false })

  const searchTerm = ref('')
  const searchQuery = ref<PatientQuery | undefined>(undefined)

  const { data: patientsResult, isLoading } = usePatientsList(searchQuery, {
    enabled: computed(() => !!searchQuery.value)
  })

  watch(searchOpen, (open) => {
    if (open) searchTerm.value = ''
  })

  watchDebounced(
    searchTerm,
    (val) => {
      if (val.length < 3) {
        searchQuery.value = undefined
        return
      }
      searchQuery.value = {
        page: 1,
        limit: 5,
        search: val || undefined
      }
    },
    { debounce: 400 }
  )

  const groups = computed(() => [
    {
      id: 'patients',
      label: searchTerm.value ? `Patients correspondant à « ${searchTerm.value} »…` : 'Patients',
      items:
        patientsResult.value?.data.map((patient) => ({
          id: patient.id,
          label: formatFullName(patient),
          email: patient.email,
          phone: patient.phone,
          avatar: {
            alt: formatFullName(patient),
            size: 'sm' as const
          },
          to: `/patients/${patient.id}`
        })) || [],
      ignoreFilter: true
    }
  ])

  defineShortcuts({
    'meta_/': () => {
      searchOpen.value = true
    }
  })
</script>

<template>
  <UModal v-model:open="searchOpen" :ui="{ content: 'w-full  max-w-2xl' }">
    <UButton
      label="Patients …"
      color="neutral"
      variant="soft"
      icon="i-hugeicons-user-search-01"
      size="md"
      class="w-full justify-start"
      aria-label="Rechercher un patient"
    >
      <template #trailing>
        <ClientOnly>
          <div class="flex items-center gap-1">
            <UKbd variant="subtle" value="meta" />
            <UKbd variant="subtle" value="/" />
          </div>
        </ClientOnly>
      </template>
    </UButton>

    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :loading="isLoading"
        :groups="groups"
        close
        placeholder="Tapez au moins 3 caractères…"
        @update:open="(open: boolean) => !open && (searchOpen = false)"
      >
        <template #item="{ item }">
          <div class="flex w-full items-center gap-x-2">
            <UAvatar :alt="item.label" />
            <div class="min-w-0 flex-1">
              <div class="flex justify-between">
                <div class="flex w-full flex-wrap items-center justify-between gap-x-2 text-[13px]">
                  <div class="font-semibold">
                    {{ item.label }}
                  </div>
                  <!-- <span class="border-accented bg-accented inline-block size-1.5 shrink-0 rounded-full border" /> -->
                  <div v-if="item.phone" class="text-muted flex items-center gap-1.5 tabular-nums">
                    <UIcon name="i-hugeicons-call-02" class="size-3" />
                    <span>{{ item.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
