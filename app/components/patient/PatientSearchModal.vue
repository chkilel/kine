<script setup lang="ts">
  const searchOpen = defineModel<boolean>('open', { default: false })

  const searchTerm = ref('')
  const searchQuery = ref<PatientQuery>({ page: 1, limit: 5 })

  const { data: patientsResult, isLoading } = usePatientsList(searchQuery)

  watch(searchOpen, (open) => {
    if (open) searchTerm.value = ''
  })

  watchDebounced(
    searchTerm,
    (val) => {
      if (val.length < 3) return
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
  <UModal v-model:open="searchOpen">
    <UButton
      label="Rechercher un patient par nom ou prénom…"
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
        placeholder="Rechercher un patient par nom ou prénom…"
        @update:open="(open: boolean) => !open && (searchOpen = false)"
      >
        <template #item="{ item }">
          <UUser
            :name="item.label"
            :avatar="{
              loading: 'lazy',
              alt: item.label
            }"
          >
            <template #description>
              <div class="text-muted flex flex-wrap items-center gap-x-2 text-[13px]">
                <div v-if="item.phone" class="flex items-center gap-1.5 tabular-nums">
                  <UIcon name="i-hugeicons-call-02" class="size-3" />
                  <span>{{ item.phone }}</span>
                </div>
                <span class="border-accented bg-accented inline-block size-1.5 shrink-0 rounded-full border" />
                <div v-if="item.email" class="flex items-center gap-1.5">
                  <UIcon name="i-hugeicons-mail-01" class="size-3" />
                  <span class="truncate">{{ item.email }}</span>
                </div>
              </div>
            </template>
          </UUser>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
