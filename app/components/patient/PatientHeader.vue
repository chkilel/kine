<script setup lang="ts">
  import { LazyPatientEditSlideover, LazyTreatmentPlanCreateSlideover } from '#components'
  import { getLocalTimeZone, parseDate, today } from '@internationalized/date'

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

  const formatNextAppointment = computed(() => {
    if (!nextAppointment.value) return null
    const { day, month, dayName } = extractDayAndMonth(nextAppointment.value.date)
    const time = removeSecondsFromTime(nextAppointment.value.startTime)
    const h = time.split(':')[0]
    const min = time.split(':')[1]
    return { day, month, dayName, time, h, min }
  })

  function openEditSlideover() {
    patientEditSlideover.open({ patient: props.patient })
  }

  function openTreatmentPlanSlideover() {
    planCreateSlideover.open({ patient: props.patient })
  }
</script>

<template>
  <div class="group bg-default relative mb-6 overflow-hidden rounded-2xl p-6 shadow-sm">
    <div
      class="from-primary-50 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-64 rounded-bl-full bg-linear-to-bl to-transparent"
    />
    <div class="relative z-10 flex flex-col gap-6 md:flex-row">
      <div class="flex shrink-0 flex-col items-center gap-3 md:items-start">
        <UAvatar
          :alt="formatFullName(patient)"
          class="ring-muted aspect-square size-28 rounded-2xl bg-cover bg-center bg-no-repeat text-4xl shadow-inner ring-4"
        />
      </div>
      <div class="flex flex-1 flex-col justify-between">
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
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

          <UCard
            variant="subtle"
            :ui="{ root: 'relative max-md:hidden shrink-0 rounded-2xl shadow-md', body: 'sm:p-4 p-3' }"
          >
            <!-- Decorative circles -->
            <div class="bg-primary/50 absolute top-4 right-4 size-12 rounded-full blur-2xl" />
            <div class="bg-success/30 absolute bottom-2 left-2 size-14 rounded-full blur-xl" />

            <div class="flex gap-3">
              <div class="relative flex flex-col items-center justify-between">
                <!-- Day name -->
                <div class="text-primary text-[10px] font-medium tracking-widest uppercase">
                  {{ formatNextAppointment?.dayName }}
                </div>

                <!-- Day number -->
                <div class="text-primary text-xl font-bold">{{ formatNextAppointment?.day }}</div>

                <!-- Month and year -->
                <div class="text-highlighted text-xs font-semibold tracking-widest uppercase">
                  {{ formatNextAppointment?.month }}
                </div>
              </div>
              <div>
                <USeparator orientation="vertical" class="h-full" />
              </div>
              <!-- Time -->
              <div class="flex flex-col justify-between font-mono text-2xl font-bold tabular-nums">
                <span class="relative leading-none">
                  {{ formatNextAppointment?.h }}
                  <span class="absolute -top-2 right-0.5 text-[10px]">h</span>
                </span>
                <span class="relative leading-none">
                  {{ formatNextAppointment?.min }}
                  <span class="absolute -top-2 right-0.5 text-[10px]">min</span>
                </span>
              </div>
            </div>
          </UCard>
        </div>
        <div class="border-default mt-2 flex items-center gap-2 border-t pt-4">
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
