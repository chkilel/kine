<script setup lang="ts">
  import { LazyPatientInformationEditSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  const overlay = useOverlay()
  const patientEditSlideover = overlay.create(LazyPatientInformationEditSlideover)

  function openEditSlideover() {
    patientEditSlideover.open({ patient })
  }

  const fullAddress = computed(() => {
    const parts = []
    if (patient?.address) parts.push(patient.address)
    if (patient?.postalCode) parts.push(patient.postalCode)
    if (patient?.city) parts.push(patient.city)
    return parts.join(' ') || '-'
  })

  const insuranceDetails = computed(() => {
    if (patient?.insuranceProvider) {
      return patient.insuranceProvider
    }
    return '-'
  })
</script>

<template>
  <AppCard title="Informations Patient" class="relative">
    <template #actions>
      <UButton
        variant="ghost"
        color="primary"
        icon="i-hugeicons-more-vertical"
        square
        @click="openEditSlideover"
        class="absolute top-3 right-3"
      />
    </template>
    <div class="space-y-4">
      <div class="grid gap-2 text-sm">
        <div class="flex items-center gap-3">
          <AppIconBox name="i-hugeicons-home-09" />
          <p class="text-muted-foreground">{{ fullAddress }}</p>
        </div>
        <div v-if="insuranceDetails !== '-'" class="flex items-center gap-3">
          <AppIconBox name="i-hugeicons-shield-user" />
          <p class="text-muted-foreground">{{ insuranceDetails }}</p>
        </div>
        <div v-if="patient?.referralSource" class="flex items-center gap-3">
          <AppIconBox name="i-hugeicons-chat-user" />
          <p class="text-muted-foreground">
            {{ patient.referralSource }}
            <span class="text-muted text-xs">(Prescripteur)</span>
          </p>
        </div>
      </div>

      <div
        v-if="patient?.emergencyContacts && patient.emergencyContacts.length > 0"
        class="border-default border-t pt-3"
      >
        <div class="mb-2 flex items-center gap-2">
          <AppIconBox name="i-hugeicons-call-02" />
          <h4 class="text-muted font-medium">Contacts d'urgence</h4>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="(contact, index) in patient.emergencyContacts"
            :key="index"
            class="bg-muted ring-default flex flex-col rounded-md px-3 py-2 ring"
          >
            <div class="flex justify-between">
              <span class="text-sm font-bold capitalize">{{ contact.name || 'Sans nom' }}</span>
              <span v-if="contact.relationship" class="text-muted text-xs">
                {{ getRelationshipLabel(contact.relationship) }}
              </span>
            </div>
            <a
              v-if="contact.number"
              class="text-primary mt-0.5 text-sm tabular-nums hover:underline"
              :href="`tel:${contact.number}`"
            >
              {{ contact.number }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>
