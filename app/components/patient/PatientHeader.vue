<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import { getLocalTimeZone, parseDate, today } from '@internationalized/date'

  const props = defineProps<{
    patient: Patient
    consultations?: Consultation[]
  }>()

  const overlay = useOverlay()
  const editSlideover = overlay.create(LazyPatientEditSlideover)
  const treatmentPlanCreateSlideover = overlay.create(LazyTreatmentPlanCreateSlideover)

  const nextAppointment = computed(() => {
    if (!props.consultations || props.consultations.length === 0) return null
    const localDate = today(getLocalTimeZone())

    const upcoming = props.consultations.filter((c) => {
      const consultDate = parseDate(c.date)
      return consultDate.compare(localDate) >= 0
    })

    return upcoming.length > 0 ? upcoming[0] : null
  })

  const formatNextAppointment = computed(() => {
    if (!nextAppointment.value) return null
    const { day, month } = extractDayAndMonth(nextAppointment.value.date)
    const startTime = removeSecondsFromTime(nextAppointment.value.startTime)
    return { day, month, startTime }
  })

  function openEditSlideover() {
    editSlideover.open({ patient: props.patient })
  }

  function openTreatmentPlanSlideover() {
    treatmentPlanCreateSlideover.open({ patient: props.patient })
  }
</script>

<template>
  <div class="group bg-default relative mb-6 overflow-hidden rounded-2xl p-6 shadow-sm">
    <div
      class="from-primary-50 dark:from-primary-900/20 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-bl-full bg-linear-to-bl to-transparent"
    ></div>
    <div class="relative z-10 flex flex-col gap-6 md:flex-row">
      <div class="flex shrink-0 flex-col items-center gap-3 md:items-start">
        <UAvatar
          :alt="formatFullName(patient)"
          class="ring-muted aspect-square size-28 rounded-2xl bg-cover bg-center bg-no-repeat text-4xl shadow-inner ring-4"
        />
      </div>
      <div class="flex flex-1 flex-col justify-between py-1">
        <div class="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div>
            <div class="mb-1 flex items-center gap-3">
              <h1 class="text-3xl tracking-tight">
                {{ patient.firstName }}
                <span class="font-bold">{{ patient.lastName }}</span>
              </h1>
              <UBadge :color="getPatientStatusColor(patient.status)" size="sm" variant="subtle">
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
          <UAlert
            v-if="nextAppointment"
            title="PROCHAIN RENDEZ-VOUS"
            variant="subtle"
            color="info"
            icon="i-hugeicons-calendar-03"
            :ui="{
              icon: 'size-14 text-info-800',
              root: 'w-auto rounded-2xl'
            }"
          >
            <template #description>
              <div class="text-info-800 flex items-center gap-2">
                <div class="text-xl font-semibold">
                  {{ formatNextAppointment?.day }}
                  <span class="capitalize">{{ formatNextAppointment?.month }}.</span>
                  à {{ formatNextAppointment?.startTime }}
                </div>
              </div>
            </template>
          </UAlert>
        </div>
        <div class="border-default mt-6 flex items-center gap-2 border-t pt-4">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-hugeicons-pencil-edit-02"
            class="hover:text-primary"
            @click="openEditSlideover"
          >
            Modifier infos
          </UButton>

          <UButton variant="ghost" color="neutral" icon="i-hugeicons-plus-sign-square" class="hover:text-primary">
            Nouvelle séance
          </UButton>
          <UButton
            variant="ghost"
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
