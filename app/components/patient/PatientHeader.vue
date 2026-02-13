<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
  import AppNextAppointmentCard from '@/components/app/AppNextAppointmentCard.vue'

  const props = defineProps<{ patient: Patient }>()

  const { data: consultations } = useConsultationsList(() => ({ patientId: props.patient?.id || '' }))

  const overlay = useOverlay()
  const patientEditSlideover = overlay.create(LazyPatientEditSlideover)
  const planCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  const nextAppointment = computed(() => {
    if (!consultations.value || consultations.value.length === 0) return null
    const localDate = today(getLocalTimeZone())

    const upcoming = consultations.value.filter((c) => {
      const consultDate = parseDate(c.date)
      return consultDate.compare(localDate) >= 0
    })

    return upcoming.length > 0 ? upcoming[0] : null
  })

  function openEditSlideover() {
    patientEditSlideover.open({ patient: props.patient })
  }

  function openTreatmentPlanSlideover() {
    planCreateSlideover.open({ patient: props.patient })
  }
</script>

<template>
  <div class="relative">
    <div
      class="from-primary-50 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-64 rounded-bl-full bg-linear-to-bl to-transparent"
    />
    <div class="relative z-10 flex flex-col gap-6 md:flex-row">
      <div class="flex shrink-0 flex-col items-center gap-3 md:items-start">
        <UAvatar
          :alt="formatFullName(patient)"
          class="ring-muted aspect-square size-22 rounded-2xl bg-cover bg-center bg-no-repeat text-4xl shadow-inner ring-4"
        />
      </div>
      <div class="flex-1">
        <div class="flex flex-col justify-between gap-4 md:flex-row">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h1 class="text-3xl tracking-tight">
                {{ patient.firstName }}
                <span class="font-bold">{{ patient.lastName }}</span>
              </h1>
              <UButton variant="ghost" color="primary" icon="i-hugeicons-edit-04" square @click="openEditSlideover" />
              <UBadge :color="getPatientStatusColor(patient.status)" size="md" variant="subtle" class="rounded-full">
                {{ getPatientStatusLabel(patient.status) }}
              </UBadge>
            </div>
            <div class="text-muted mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div class="flex items-center gap-1.5">
                <UIcon name="i-hugeicons-birthday-cake" class="size-4.5" />
                <span v-if="patient.dateOfBirth">
                  {{ calculateAge(patient.dateOfBirth) }} ans ({{ formatFrenchDate(patient.dateOfBirth) }})
                </span>
              </div>
              <div
                v-if="patient.phone"
                class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
              >
                <UIcon name="i-hugeicons-call-02" class="size-4.5" />
                <a :href="`tel:${patient.phone}`">
                  {{ patient.phone }}
                </a>
              </div>
              <div
                v-if="patient.email"
                class="hover:text-primary flex cursor-pointer items-center gap-1.5 transition-colors"
              >
                <UIcon name="i-hugeicons-mail-01" class="size-4.5" />
                <a class="truncate" :href="`mailto:${patient.email}`">
                  {{ patient.email }}
                </a>
              </div>
            </div>
          </div>

          <AppNextAppointmentCard
            v-if="nextAppointment?.date && nextAppointment?.startTime"
            :date="nextAppointment.date"
            :start-time="nextAppointment.startTime"
          />
        </div>
        <div class="flex items-center gap-2">
          <!-- <UButton variant="soft" color="primary" icon="i-hugeicons-pencil-edit-02" @click="openEditSlideover">
            Modifier infos
          </UButton> -->

          <UButton variant="soft" color="neutral" icon="i-hugeicons-plus-sign-square" class="hover:text-primary">
            Nouvelle séance
          </UButton>
          <UButton
            variant="soft"
            color="neutral"
            icon="i-hugeicons-property-add"
            class="hover:text-primary"
            @click="openTreatmentPlanSlideover"
          >
            Nouveau plan
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
