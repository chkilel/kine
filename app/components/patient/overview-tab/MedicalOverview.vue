<script setup lang="ts">
  import { LazyPatientMedicalEditSlideover } from '#components'

  const { patient } = defineProps<{ patient: Patient }>()

  function openEditSlideover() {
    const medicalSlideover = useOverlay().create(LazyPatientMedicalEditSlideover)
    medicalSlideover.open({ patient })
  }

  const medicalSections = computed(() => [
    { title: 'Allergies', items: patient.allergies },
    { title: 'Chirurgies', items: patient.surgeries },
    { title: 'Antécédents', items: patient.medicalConditions },
    { title: 'Traitement en cours', items: patient.medications }
  ])

  const hasMedicalInfo = computed(
    () =>
      patient.allergies.length > 0 ||
      patient.surgeries.length > 0 ||
      patient.medicalConditions.length > 0 ||
      patient.medications.length > 0
  )
</script>

<template>
  <AppCard title="Données Médicales" icon="i-hugeicons-treatment" class="relative">
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
    <template v-if="!hasMedicalInfo">
      <UEmpty
        size="xs"
        variant="subtle"
        icon="i-hugeicons-medical-file"
        title="Aucune information médicale"
        description="Aucune donnée médicale n'a été enregistrée pour ce patient."
      />
    </template>
    <div v-else class="divide-default grid">
      <template v-for="(section, index) in medicalSections" :key="index">
        <div
          v-if="section.items && section.items.length > 0"
          :key="section.title"
          :class="{ 'pb-2': index !== medicalSections?.length - 1 }"
        >
          <h4 class="mb-1 text-[11px] tracking-wide uppercase">{{ section.title }}</h4>
          <UAlert
            color="info"
            variant="soft"
            :ui="{
              root: 'p-2 rounded-sm',
              title: 'text-[11px] font-normal  tracking-wide uppercase'
            }"
          >
            <template #description>
              <ul class="text-default list-inside">
                <li v-for="item in section.items" :key="item" class="text-xs">- {{ item }}</li>
              </ul>
            </template>
          </UAlert>
        </div>
      </template>
    </div>
  </AppCard>
</template>
