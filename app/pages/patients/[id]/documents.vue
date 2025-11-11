<script setup lang="ts">
  const route = useRoute()
  const toast = useToast()

  const patientId = (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) || ''
  const { data: patient, status: patientStatus } = await useFetch<Patient>(`/api/patients/${patientId}`)
  const {
    data: documents,
    status: documentsStatus,
    refresh: refreshDocuments
  } = await useFetch<PatientDocument[]>(`/api/patients/${patientId}/documents`)

  if (patientStatus.value === 'error') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Patient introuvable'
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

  function onDocumentUpdated() {
    refreshDocuments()
  }

  function formatFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`
  }
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="patient ? `${formatFullName(patient)} - Documents` : 'Documents du patient'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="$router.back()">Retour</UButton>
        </template>

        <template #right>
          <PatientDocumentUpload :patient-id="patientId" @uploaded="onDocumentUploaded" />
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
                <p class="text-muted-foreground">{{ patient.email || 'Aucun e‑mail' }}</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="text-center">
              <p class="text-primary text-2xl font-bold">{{ documents?.length || 0 }}</p>
              <p class="text-muted-foreground text-sm">Documents au total</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">
                {{ documents?.filter((d) => d.category === 'referral').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Références</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">
                {{ documents?.filter((d) => d.category === 'imaging').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Imagerie</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600">
                {{ documents?.filter((d) => d.category === 'lab_results').length || 0 }}
              </p>
              <p class="text-muted-foreground text-sm">Résultats de laboratoire</p>
            </div>
          </div>
        </UCard>

        <!-- Filters and Actions -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <USelect
              v-model="categoryFilter"
              :items="[
                { label: 'Tous les documents', value: 'all' },
                { label: 'Références', value: 'referral' },
                { label: 'Imagerie', value: 'imaging' },
                { label: 'Résultats de laboratoire', value: 'lab_results' },
                { label: 'Notes de traitement', value: 'treatment_notes' },
                { label: 'Autre', value: 'other' }
              ]"
              placeholder="Filtrer par catégorie"
            class="w-48"
          />
          </div>

          <PatientDocumentUpload :patient-id="patientId" @uploaded="onDocumentUploaded" />
        </div>

        <!-- Documents List -->
        <PatientDocumentList
          :patient-id="patientId"
          :documents="documents?.filter((d) => categoryFilter === 'all' || d.category === categoryFilter) || []"
          @deleted="onDocumentDeleted"
          @updated="onDocumentUpdated"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
