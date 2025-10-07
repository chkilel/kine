# Frontend Implementation

## 1. Composables for API Integration

```typescript
// composables/usePatients.ts
export const usePatients = () => {
  const { $fetch } = useNuxtApp()
  const { data: user } = useAuth()

  const patients = ref<Patient[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPatients = async (params?: { page?: number; limit?: number; search?: string }) => {
    if (!user.value?.organizationId) return

    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/organizations/${user.value.organizationId}/patients`, {
        query: params
      })

      patients.value = response.data
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPatient = async (patientData: CreatePatientInput) => {
    if (!user.value?.organizationId) return

    try {
      const newPatient = await $fetch(`/api/organizations/${user.value.organizationId}/patients`, {
        method: 'POST',
        body: patientData
      })

      patients.value.unshift(newPatient)
      return newPatient
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    patients: readonly(patients),
    loading: readonly(loading),
    error: readonly(error),
    fetchPatients,
    createPatient
  }
}
```

## 2. Patient Management Page

```vue
<!-- pages/patients/index.vue -->
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">{{ $t('patients.title') }}</h1>
      <UButton @click="showCreateModal = true" icon="i-lucide-plus">
        {{ $t('patients.create') }}
      </UButton>
    </div>

    <!-- Search and Filters -->
    <div class="flex gap-4">
      <UInput
        v-model="searchQuery"
        :placeholder="$t('patients.search')"
        icon="i-lucide-search"
        class="flex-1"
        @input="debouncedSearch"
      />

      <USelect v-model="sortBy" :options="sortOptions" @change="fetchPatients" />
    </div>

    <!-- Patients Table -->
    <UCard>
      <UTable :rows="patients" :columns="columns" :loading="loading" @select="handlePatientSelect">
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="`${row.firstName} ${row.lastName}`" size="sm" />
            <div>
              <p class="font-medium">{{ row.firstName }} {{ row.lastName }}</p>
              <p class="text-sm text-gray-500">{{ row.email }}</p>
            </div>
          </div>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="getActionItems(row)">
            <UButton variant="ghost" icon="i-lucide-more-horizontal" size="sm" />
          </UDropdown>
        </template>
      </UTable>

      <!-- Pagination -->
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">
          {{ $t('common.showing') }} {{ (currentPage - 1) * pageSize + 1 }} {{ $t('common.to') }}
          {{ Math.min(currentPage * pageSize, totalCount) }} {{ $t('common.of') }} {{ totalCount }}
          {{ $t('patients.title') }}
        </p>

        <UPagination
          v-model="currentPage"
          :page-count="pageSize"
          :total="totalCount"
          @update:model-value="fetchPatients"
        />
      </div>
    </UCard>

    <!-- Create Patient Modal -->
    <PatientCreateModal v-model="showCreateModal" @created="handlePatientCreated" />
  </div>
</template>

<script setup>
const { t } = useI18n()
const { patients, loading, fetchPatients, createPatient } = usePatients()

// Reactive data
const searchQuery = ref('')
const sortBy = ref('createdAt')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const showCreateModal = ref(false)

// Computed
const columns = computed(() => [
  { key: 'name', label: t('patients.name') },
  { key: 'phone', label: t('patients.phone') },
  { key: 'dateOfBirth', label: t('patients.dateOfBirth') },
  { key: 'createdAt', label: t('common.createdAt') },
  { key: 'actions', label: '' }
])

const sortOptions = computed(() => [
  { value: 'firstName', label: t('patients.firstName') },
  { value: 'lastName', label: t('patients.lastName') },
  { value: 'createdAt', label: t('common.createdAt') }
])

// Methods
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchPatients()
}, 300)

const handlePatientSelect = (patient) => {
  navigateTo(`/patients/${patient.id}`)
}

const handlePatientCreated = (patient) => {
  showCreateModal.value = false
  fetchPatients()
}

const getActionItems = (patient) => [
  [
    {
      label: t('common.view'),
      icon: 'i-lucide-eye',
      click: () => navigateTo(`/patients/${patient.id}`)
    }
  ],
  [
    {
      label: t('common.edit'),
      icon: 'i-lucide-edit',
      click: () => navigateTo(`/patients/${patient.id}/edit`)
    }
  ],
  [
    {
      label: t('common.delete'),
      icon: 'i-lucide-trash',
      click: () => handleDeletePatient(patient)
    }
  ]
]

// Lifecycle
onMounted(() => {
  fetchPatients()
})

// SEO
definePageMeta({
  title: 'Patients',
  requiresAuth: true
})
</script>
```

## 3. Internationalization Files

```json
// locales/fr.json
{
  "navigation": {
    "dashboard": "Tableau de bord",
    "patients": "Patients",
    "appointments": "Rendez-vous",
    "treatments": "Traitements",
    "billing": "Facturation",
    "reports": "Rapports",
    "settings": "Paramètres"
  },
  "patients": {
    "title": "Patients",
    "create": "Nouveau patient",
    "search": "Rechercher un patient...",
    "name": "Nom",
    "firstName": "Prénom",
    "lastName": "Nom de famille",
    "email": "Email",
    "phone": "Téléphone",
    "dateOfBirth": "Date de naissance",
    "gender": "Genre",
    "address": "Adresse",
    "emergencyContact": "Contact d'urgence",
    "medicalHistory": "Antécédents médicaux"
  },
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "view": "Voir",
    "search": "Rechercher",
    "loading": "Chargement...",
    "showing": "Affichage de",
    "to": "à",
    "of": "sur",
    "createdAt": "Créé le"
  }
}
```
