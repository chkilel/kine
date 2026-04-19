<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import { getLocalTimeZone, parseDate, today } from '@internationalized/date'

  const props = defineProps<{ patient: Patient }>()

  const { data: appointment } = useAppointmentsList(() => ({ patientId: props.patient?.id || '' }))

  const overlay = useOverlay()
  const patientEditSlideover = overlay.create(LazyPatientEditSlideover)
  const planCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  const nextAppointment = computed(() => {
    if (!appointment.value || appointment.value.length === 0) return null
    const localDate = today(getLocalTimeZone())

    const upcoming = appointment.value.filter((c) => {
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
  <div class="relative z-10 flex flex-col gap-4 md:flex-row">
    <UAvatar :alt="formatFullName(patient)" class="ring-accented aspect-square size-15 text-3xl ring-2" />
    <div class="flex-1">
      <div class="flex flex-col items-start justify-between gap-4 md:flex-row">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <h1 class="text-xl tracking-tight">
              {{ patient.firstName }}
              <span class="font-bold">{{ patient.lastName }}</span>
            </h1>
            <UButton variant="ghost" color="primary" icon="i-hugeicons-edit-04" square @click="openEditSlideover" />
            <UBadge :color="getPatientStatusColor(patient.status)" size="md" variant="subtle" class="rounded-full">
              {{ getPatientStatusLabel(patient.status) }}
            </UBadge>
          </div>
          <div class="text-muted flex flex-wrap items-start gap-x-4 gap-y-1 text-[13px]">
            <div class="flex items-center gap-1.5">
              <AppIconBox size="md" name="i-hugeicons-calendar-user" class="p-1" />
              <span v-if="patient.dateOfBirth" class="font-semibold">{{ calculateAge(patient.dateOfBirth) }} ans</span>
              ({{ formatDate(patient.dateOfBirth) }})
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
        </div>

        <!-- <AppNextAppointmentCard -->
        <!-- v-if="nextAppointment?.date && nextAppointment?.startTime" -->
        <!-- :date="nextAppointment.date" -->
        <!-- :start-time="nextAppointment.startTime" -->
        <!-- /> -->
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
