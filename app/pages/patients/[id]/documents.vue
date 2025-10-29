<script setup lang="ts">
  import type { Patient, PatientDocument } from '~~/shared/types/patient.types'

  const route = useRoute()
  const toast = useToast()

  const { data: patient, status: patientStatus } = await useFetch<Patient>(`/api/patients/${route.params.id}`)
  const {
    data: documents,
    status: documentsStatus,
    refresh: refreshDocuments
  } = await useFetch<PatientDocument[]>(`/api/patients/${route.params.id}/documents`)

  if (patientStatus.value === 'error') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Patient not found'
    })
  }

  const categoryFilter = ref('all')

  watch(categoryFilter, async () => {
    await refreshDocuments()
  })

  function onDocumentUploaded() {
    refreshDocuments()
  }

  function onDocumentDeleted() {
    refreshDocuments()
  }

  function formatFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`
  }
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="patient ? `${formatFullName(patient)} - Documents` : 'Patient Documents'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="$router.back()">Back</UButton>
        </template>

        <template #right>
          <PatientDocumentUpload :patient-id="route.params.id" @uploaded="onDocumentUploaded" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="patientStatus === 'pending' || documentsStatus === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="patient" class="space-y-6">
        <!-- Patient Info Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UAvatar
                :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(formatFullName(patient))}&background=random`"
                size="lg"
              />
              <div>
                <h2 class="text-xl font-bold">{{ formatFullName(patient) }}</h2>
                <p class="text-muted-foreground">{{ patient.email || 'No email' }}</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="text-center">
              <p class="text-primary text-2xl font-bold">{{ documents?.length || 0 }}</p>
              <p class="text-muted-foreground text-sm">Total Documents</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">
                {{ documents?.filter((d) => d.category === 'referral').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Referrals</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">
                {{ documents?.filter((d) => d.category === 'imaging').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Imaging</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600">
                {{ documents?.filter((d) => d.category === 'lab_results').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Lab Results</p>
            </div>
          </div>
        </UCard>

        <!-- Filters -->
        <div class="flex items-center gap-4">
          <USelect
            v-model="categoryFilter"
            :items="[
              { label: 'All Documents', value: 'all' },
              { label: 'Referrals', value: 'referral' },
              { label: 'Imaging', value: 'imaging' },
              { label: 'Lab Results', value: 'lab_results' },
              { label: 'Treatment Notes', value: 'treatment_notes' },
              { label: 'Other', value: 'other' }
            ]"
            placeholder="Filter by category"
            class="w-48"
          />
        </div>

        <!-- Documents List -->
        <PatientDocumentList
          :patient-id="route.params.id"
          :documents="documents?.filter((d) => categoryFilter === 'all' || d.category === categoryFilter) || []"
          @deleted="onDocumentDeleted"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
