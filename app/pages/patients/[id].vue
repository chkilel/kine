<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import type { BreadcrumbItem } from '@nuxt/ui'

  const route = useRoute()
  const overlay = useOverlay()

  // --- Data fetching
  const { data: patient, error, isPending } = usePatientById(() => route.params.id as string)

  // --- Overlays
  const patientEditSlideover = overlay.create(LazyPatientEditSlideover)
  const planCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  // --- State
  const showMoreInfo = ref(false)

  // --- Computed
  const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Accueil', icon: 'i-hugeicons-home-01', to: '/' },
    { label: 'Patients', to: '/patients' },
    { label: patient.value ? formatFullName(patient.value) : 'Patient' }
  ])

  const fullAddress = computed(() => {
    const { address, postalCode, city } = patient.value ?? {}
    return [address, postalCode, city].filter(Boolean).join(' ') || '-'
  })

  const insuranceDetails = computed(() => patient.value?.insuranceProvider ?? '-')

  const hasEmergencyContacts = computed(() => (patient.value?.emergencyContacts?.length ?? 0) > 0)

  // --- Error handling
  watchEffect(() => {
    if (!error.value) return
    const err = error.value as any
    throw createError({
      statusCode: err.statusCode ?? err.status ?? 404,
      statusMessage: err.statusMessage ?? err.message ?? 'Patient introuvable'
    })
  })

  // --- Handlers
  function openEditSlideover() {
    if (!patient.value) return
    patientEditSlideover.open({ patient: patient.value })
  }

  function openTreatmentPlanSlideover() {
    if (!patient.value) return
    planCreateSlideover.open({ patient: patient.value })
  }
</script>

<template>
  <AppDashboardPage id="patient-profil" :breadcrumbs="breadcrumbItems">
    <div v-if="isPending" class="flex justify-center py-8">
      <UIcon name="i-hugeicons-loading-03" class="animate-spin text-4xl" />
    </div>
    <div v-else-if="patient" class="space-y-6">
      <UCard :ui="{ body: 'sm:py-4 py-3' }">
        <!-- Patient Header -->
        <div class="relative z-10 flex flex-col gap-4 md:flex-row">
          <div class="flex flex-1 gap-x-4">
            <div class="flex-1 space-y-1.5">
              <div class="flex items-center gap-2">
                <h1 class="text-xl tracking-tight">
                  {{ patient.firstName }}
                  <span class="font-bold">{{ patient.lastName }}</span>
                </h1>
                <UButton variant="ghost" color="primary" icon="i-hugeicons-edit-04" square @click="openEditSlideover" />
              </div>
              <div class="text-muted flex flex-wrap items-start gap-x-5 gap-y-1 text-[13px]">
                <div class="flex items-center gap-1.5">
                  <AppIconBox size="md" name="i-hugeicons-calendar-user" class="p-1" />
                  <div class="flex items-center gap-1.5">
                    <span v-if="patient.dateOfBirth" class="font-semibold">
                      {{ calculateAge(patient.dateOfBirth) }} ans
                    </span>
                    ({{ formatDate(patient.dateOfBirth) }})
                  </div>
                </div>
                <div
                  v-if="patient.phone"
                  class="hover:text-primary flex cursor-pointer items-center gap-1.5 tabular-nums transition-colors"
                >
                  <AppIconBox size="md" name="i-hugeicons-call-02" class="p-1" />
                  <a :href="`tel:${patient.phone}`">
                    {{ patient.phone }}
                  </a>
                </div>
                <UButton
                  color="neutral"
                  variant="soft"
                  icon="i-hugeicons-arrow-down-01"
                  size="xs"
                  square
                  :ui="{
                    trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
                  }"
                  @click="showMoreInfo = !showMoreInfo"
                />
              </div>

              <!-- Collapsible Patient Information -->
              <UCollapsible v-model:open="showMoreInfo">
                <template #content>
                  <div class="space-y-2">
                    <div class="grid gap-1.5 text-sm text-[13px] sm:grid-cols-2">
                      <div class="flex items-center gap-1.5">
                        <AppIconBox size="md" name="i-hugeicons-home-09" class="p-1" />
                        <p class="text-muted-foreground">{{ fullAddress }}</p>
                      </div>
                      <div v-if="insuranceDetails !== '-'" class="flex items-center gap-1.5">
                        <AppIconBox size="md" name="i-hugeicons-shield-user" class="p-1" />
                        <p class="text-muted-foreground">{{ insuranceDetails }}</p>
                      </div>
                      <div v-if="patient?.referralSource" class="flex items-center gap-1.5">
                        <AppIconBox size="md" name="i-hugeicons-chat-user" class="p-1" />
                        <p class="text-muted-foreground">
                          {{ patient.referralSource }}
                          <span class="text-muted text-xs">(Prescripteur)</span>
                        </p>
                      </div>
                      <div
                        v-if="patient.email"
                        class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
                      >
                        <AppIconBox size="md" name="i-hugeicons-mail-01" class="p-1" />
                        <a class="truncate" :href="`mailto:${patient.email}`">
                          {{ patient.email }}
                        </a>
                      </div>
                    </div>

                    <!-- Emergency contacts -->
                    <div v-if="hasEmergencyContacts" class="border-default border-t pt-3">
                      <div class="mb-2 flex items-center gap-2">
                        <AppIconBox size="md" name="i-hugeicons-call-02" class="p-1" />
                        <h4 class="text-toned text-sm font-medium">Contacts d'urgence</h4>
                      </div>
                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div
                          v-for="(contact, index) in patient.emergencyContacts"
                          :key="index"
                          class="bg-muted border-default flex flex-col rounded-sm border px-2 py-1.5"
                        >
                          <div class="flex justify-between">
                            <span class="text-xs font-semibold capitalize">{{ contact.name || 'Sans nom' }}</span>
                            <span v-if="contact.relationship" class="text-muted text-xs">
                              {{ getRelationshipLabel(contact.relationship) }}
                            </span>
                          </div>
                          <a
                            v-if="contact.number"
                            class="text-primary mt-0.5 text-[13px] font-medium hover:underline"
                            :href="`tel:${contact.number}`"
                          >
                            {{ formatPhoneNumber(contact.number) }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </UCollapsible>
            </div>
          </div>
          <div class="flex flex-col justify-start gap-2">
            <UButton variant="soft" color="neutral" icon="i-hugeicons-plus-sign-square" class="hover:text-primary">
              Séance
            </UButton>
            <UButton
              variant="soft"
              color="neutral"
              icon="i-hugeicons-property-add"
              class="hover:text-primary"
              @click="openTreatmentPlanSlideover"
            >
              Plan
            </UButton>
          </div>
        </div>
      </UCard>

      <NuxtPage />
    </div>
  </AppDashboardPage>
</template>
