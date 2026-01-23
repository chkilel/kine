<script setup lang="ts">
  const { consultation } = defineProps<{
    consultation: Consultation
  }>()

  const emit = defineEmits<{
    'start-session': [consultation: Consultation]
    'view-patient': [patientId: string]
    'view-consultation': [consultation: Consultation]
  }>()

  const isInProgress = computed(() => consultation.status === 'in_progress')
  const isCompleted = computed(() => consultation.status === 'completed')
  const isScheduled = computed(() => ['scheduled', 'confirmed'].includes(consultation.status))
</script>

<template>
  <div
    :class="[
      'ring-default flex items-center gap-4 rounded-xl p-4 shadow-sm ring transition-all',
      isInProgress && 'bg-info/5 ring-primary shadow-primary shadow-lg',
      !isInProgress && 'bg-muted hover:shadow-md',
      isCompleted && 'bg-muted opacity-75 grayscale-[0.5]',
      !isCompleted && !isInProgress && 'group'
    ]"
  >
    <div
      :class="[
        'w-1.5 self-stretch rounded-full',
        isInProgress && 'bg-primary',
        isCompleted && 'bg-muted',
        !isCompleted && !isInProgress && 'bg-success'
      ]"
    />

    <div class="w-16 shrink-0 text-center">
      <p :class="['text-lg font-bold', isInProgress ? 'text-primary' : isCompleted ? 'text-muted' : 'text-default']">
        {{ removeSecondsFromTime(consultation.startTime) }}
      </p>
      <p
        :class="[
          'text-[10px] font-bold uppercase',
          isInProgress && 'text-primary',
          isCompleted && 'text-muted',
          !isCompleted && !isInProgress && 'text-muted'
        ]"
      >
        {{ isInProgress ? 'En cours' : isCompleted ? 'Fait' : `${consultation.duration} min` }}
      </p>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-3">
        <h4 :class="['font-bold', isCompleted && 'line-through', !isCompleted ? 'text-default' : 'text-muted']">
          {{ consultation.patientName }}
        </h4>
        <UBadge v-if="isInProgress" label="00:04" size="sm" color="success" variant="soft" class="rounded-lg" />
      </div>
      <div class="mt-1 flex items-center gap-4">
        <p class="text-muted flex items-center gap-1 text-xs">
          <UIcon
            :name="getConsultationStatusIcon(consultation.status)"
            :class="['text-sm', isInProgress && 'text-primary']"
          />
          {{ getConsultationStatusLabel(consultation.status || 'follow_up') }}
        </p>
        <UBadge
          v-if="consultation.roomName"
          :label="consultation.roomName"
          icon="i-hugeicons-door-01"
          size="sm"
          variant="subtle"
          class="rounded-lg uppercase"
        />
      </div>
    </div>

    <UChip v-if="isInProgress" color="success" size="2xl">
      <!-- <UBadge -->
      <!-- label="En cours" -->
      <!-- icon="i-hugeicons-loading-02" -->
      <!-- size="md" -->
      <!-- color="success" -->
      <!-- variant="subtle" -->
      <!-- :ui="{ -->
      <!-- base: 'rounded-full', -->
      <!-- label: 'animate-pulse', -->
      <!-- leadingIcon: 'animate-spin' -->
      <!-- }" -->
      <!-- /> -->
      <UButton
        label="Voir seance"
        icon="i-hugeicons-view"
        size="lg"
        color="success"
        variant="subtle"
        :ui="{
          base: 'rounded-xl',
          label: 'animate-pulse',
          leadingIcon: 'animate-pulse'
        }"
      />
    </UChip>
    <div v-if="isScheduled" class="shrink-0">
      <UButton
        label="Commencer"
        icon="i-hugeicons-play"
        size="lg"
        color="success"
        variant="solid"
        :ui="{
          base: 'rounded-xl'
        }"
        class="shadow-success/10 font-semibold text-white shadow-lg"
        @click="emit('start-session', consultation)"
      />
    </div>

    <div v-if="isCompleted" class="shrink-0">
      <UBadge
        label="Terminée"
        size="md"
        icon="i-hugeicons-checkmark-circle-02"
        color="neutral"
        variant="soft"
        class="rounded-xl"
      />
    </div>

    <UDropdownMenu
      :items="[
        [
          {
            label: 'Patient',
            icon: 'i-hugeicons-profile-02',
            onSelect: () => emit('view-patient', consultation.patientId),
            to: `/patients/${consultation.patientId}`
          },
          {
            label: 'RDV',
            icon: 'i-hugeicons-appointment-02',
            onSelect: () => emit('view-consultation', consultation)
          }
        ]
      ]"
      :content="{ align: 'center' }"
      :ui="{ content: 'min-w-0' }"
    >
      <UButton icon="i-hugeicons-more-vertical" variant="ghost" color="neutral" square />
    </UDropdownMenu>
  </div>
</template>
