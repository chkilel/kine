<script setup lang="ts">
  import type { Patient } from '~~/shared/types/patient.types'

  const route = useRoute()
  const toast = useToast()

  const { data: patient, status, error } = await useFetch<Patient>(`/api/patients/${route.params.id}`)

  if (error.value) {
    throw createError({
      statusCode: error.value?.statusCode || 404,
      statusMessage: error.value?.statusMessage || 'Patient not found'
    })
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  function formatFullName(patient: Patient) {
    return `${patient.firstName} ${patient.lastName}`
  }
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="patient ? formatFullName(patient) : 'Patient Profile'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="$router.back()">Back</UButton>
        </template>

        <template #right>
          <PatientEditModal v-if="patient" :patient="patient" @updated="() => refreshNuxtData()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
      </div>

      <div v-else-if="patient" class="space-y-6">
        <!-- Patient Overview Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-4">
              <UAvatar
                :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(formatFullName(patient))}&background=random`"
                size="xl"
              />
              <div>
                <h2 class="text-2xl font-bold">{{ formatFullName(patient) }}</h2>
                <p class="text-muted-foreground">{{ patient.email || 'No email' }}</p>
                <UBadge
                  :color="patient.status === 'active' ? 'success' : patient.status === 'inactive' ? 'warning' : 'error'"
                  variant="subtle"
                >
                  {{ patient.status.charAt(0).toUpperCase() + patient.status.slice(1) }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <!-- Basic Information -->
            <div>
              <h3 class="mb-4 text-lg font-semibold">Basic Information</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Date of Birth</label>
                  <p class="text-sm">{{ formatDate(patient.dateOfBirth) }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Gender</label>
                  <p class="text-sm">
                    {{ patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '-' }}
                  </p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Phone</label>
                  <p class="text-sm">{{ patient.phone || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Address Information -->
            <div>
              <h3 class="mb-4 text-lg font-semibold">Address</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Address</label>
                  <p class="text-sm">{{ patient.address || '-' }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">City</label>
                  <p class="text-sm">{{ patient.city || '-' }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Postal Code</label>
                  <p class="text-sm">{{ patient.postalCode || '-' }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Country</label>
                  <p class="text-sm">{{ patient.country || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Emergency Contact -->
            <div>
              <h3 class="mb-4 text-lg font-semibold">Emergency Contact</h3>
              <div class="space-y-3">
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Contact Name</label>
                  <p class="text-sm">{{ patient.emergencyContactName || '-' }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Contact Phone</label>
                  <p class="text-sm">{{ patient.emergencyContactPhone || '-' }}</p>
                </div>
                <div>
                  <label class="text-muted-foreground text-sm font-medium">Relationship</label>
                  <p class="text-sm">{{ patient.emergencyContactRelationship || '-' }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Insurance Information -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Insurance Information</h3>
          </template>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label class="text-muted-foreground text-sm font-medium">Insurance Provider</label>
              <p class="text-sm">{{ patient.insuranceProvider || '-' }}</p>
            </div>
            <div>
              <label class="text-muted-foreground text-sm font-medium">Insurance Number</label>
              <p class="text-sm">{{ patient.insuranceNumber || '-' }}</p>
            </div>
          </div>
        </UCard>

        <!-- Referral Information -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Referral Information</h3>
          </template>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label class="text-muted-foreground text-sm font-medium">Referral Source</label>
              <p class="text-sm">{{ patient.referralSource || '-' }}</p>
            </div>
            <div>
              <label class="text-muted-foreground text-sm font-medium">Referral Date</label>
              <p class="text-sm">{{ formatDate(patient.referralDate) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Medical Information -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Medical Information</h3>
          </template>
          <div class="space-y-6">
            <div>
              <label class="text-muted-foreground text-sm font-medium">Medical History</label>
              <div v-if="patient.medicalHistory && patient.medicalHistory.length > 0" class="mt-2 space-y-2">
                <div v-for="(item, index) in patient.medicalHistory" :key="index" class="bg-muted rounded-lg p-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium">{{ item.condition }}</p>
                      <p class="text-muted-foreground text-sm">{{ item.diagnosisDate }}</p>
                    </div>
                    <UBadge
                      :color="item.status === 'active' ? 'error' : item.status === 'resolved' ? 'success' : 'warning'"
                      variant="subtle"
                    >
                      {{ item.status }}
                    </UBadge>
                  </div>
                  <p v-if="item.notes" class="mt-2 text-sm">{{ item.notes }}</p>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm">No medical history recorded</p>
            </div>

            <div>
              <label class="text-muted-foreground text-sm font-medium">Medications</label>
              <div v-if="patient.medications && patient.medications.length > 0" class="mt-2 space-y-2">
                <div v-for="(med, index) in patient.medications" :key="index" class="bg-muted rounded-lg p-3">
                  <p class="font-medium">{{ med.name }}</p>
                  <p class="text-muted-foreground text-sm">{{ med.dosage }} - {{ med.frequency }}</p>
                  <p v-if="med.prescribedBy" class="text-muted-foreground text-sm">
                    Prescribed by: {{ med.prescribedBy }}
                  </p>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm">No medications recorded</p>
            </div>

            <div>
              <label class="text-muted-foreground text-sm font-medium">Allergies</label>
              <div v-if="patient.allergies && patient.allergies.length > 0" class="mt-2 space-y-2">
                <div v-for="(allergy, index) in patient.allergies" :key="index" class="bg-muted rounded-lg p-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium">{{ allergy.allergen }}</p>
                      <p class="text-muted-foreground text-sm">{{ allergy.reaction }}</p>
                    </div>
                    <UBadge
                      :color="
                        allergy.severity === 'severe'
                          ? 'error'
                          : allergy.severity === 'moderate'
                            ? 'warning'
                            : 'success'
                      "
                      variant="subtle"
                    >
                      {{ allergy.severity }}
                    </UBadge>
                  </div>
                  <p v-if="allergy.notes" class="mt-2 text-sm">{{ allergy.notes }}</p>
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm">No allergies recorded</p>
            </div>
          </div>
        </UCard>

        <!-- Notes -->
        <UCard v-if="patient.notes">
          <template #header>
            <h3 class="text-lg font-semibold">Notes</h3>
          </template>
          <p class="text-sm whitespace-pre-wrap">{{ patient.notes }}</p>
        </UCard>

        <!-- Documents Section -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Documents</h3>
              <UButton icon="i-lucide-plus" size="sm" @click="$router.push(`/patients/${route.params.id}/documents`)">
                Manage Documents
              </UButton>
            </div>
          </template>
          <p class="text-muted-foreground text-sm">
            Click "Manage Documents" to view, upload, and manage patient documents including referrals, imaging, lab
            results, and treatment notes.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
