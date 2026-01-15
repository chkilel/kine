<script setup lang="ts">
  const props = defineProps<{ consultation: Consultation }>()

  const emit = defineEmits<{
    edit: [consultation: Consultation]
    delete: [consultation: Consultation]
  }>()

  const { getTherapistName } = useOrganizationMembers()
</script>

<template>
  <div
    class="bg-muted hover:border-default flex flex-col gap-4 rounded-lg border border-transparent p-3 transition-colors sm:flex-row sm:items-center"
  >
    <div class="flex flex-1 items-center gap-4">
      <div class="flex">
        <AppDateBadge :date="consultation.date" variant="solid" color="info" class="rounded-r-none" />
        <AppTimeBadge
          :date="consultation.date"
          :time="consultation.startTime"
          color="info"
          variant="soft"
          class="rounded-l-none"
        />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-default truncate font-semibold">
          {{ getConsultationTypeLabel(consultation.type || 'follow_up') }}
        </p>

        <div class="text-muted sm:divide-default flex flex-col text-xs sm:flex-row sm:items-center sm:divide-x">
          <div class="flex items-center gap-1 sm:pr-3">
            <UIcon :name="getLocationIcon(consultation.location || 'clinic')" />
          </div>

          <div class="flex items-center gap-1 sm:px-3">
            <UIcon name="i-hugeicons-clock-01" />
            <p>{{ consultation.duration }} min</p>
          </div>

          <div v-if="consultation.roomName" class="flex items-center gap-1 sm:px-3">
            <UIcon name="i-hugeicons-hospital-bed-02" />
            <p>{{ consultation.roomName }}</p>
          </div>
          <div v-if="consultation.therapistId" class="flex items-center gap-1 sm:px-3">
            <UIcon name="i-hugeicons-user" />
            <p>{{ getTherapistName(consultation.therapistId) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex pl-4">
      <div class="flex items-center gap-2">
        <UBadge :color="getConsultationStatusColor(consultation.status)" variant="subtle">
          {{ getConsultationStatusLabel(consultation.status) }}
        </UBadge>
      </div>
      <div class="border-muted ml-2 flex items-center gap-1 border-l pl-2">
        <div class="flex items-center justify-end gap-2">
          <UButton
            icon="i-lucide-edit"
            variant="ghost"
            color="info"
            size="sm"
            square
            @click="emit('edit', consultation)"
          />
          <UButton
            icon="i-lucide-trash"
            variant="ghost"
            color="error"
            size="sm"
            square
            @click="emit('delete', consultation)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
