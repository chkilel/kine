<script setup lang="ts">
  const upcomingSessions = [
    {
      date: '18',
      month: 'OCT',
      type: 'Renforcement',
      time: '11:00 - 30 min',
      status: 'scheduled' as ConsultationStatus
    },
    {
      date: '15',
      month: 'OCT',
      type: 'Bilan initial',
      time: '10:00 - 45 min',
      status: 'completed' as ConsultationStatus
    },
    {
      date: '12',
      month: 'OCT',
      type: 'Mobilisation',
      time: '09:00 - 30 min',
      status: 'no_show' as ConsultationStatus
    }
  ]
</script>

<template>
  <AppCard variant="outline" title="Aperçu des prochaines/dernières séances">
    <ul class="space-y-2">
      <li
        v-for="session in upcomingSessions"
        :key="session.date"
        class="bg-muted hover:bg-elevated flex items-center justify-between rounded-lg p-3 py-4"
      >
        <div class="flex items-center gap-4">
          <div class="border-default bg-default w-12 rounded-lg border py-1 text-center">
            <p class="text-sm font-bold">{{ session.date }}</p>
            <p class="text-muted text-xs">{{ session.month }}</p>
          </div>
          <div>
            <p class="font-semibold">{{ session.type }}</p>
            <p class="text-muted text-sm">{{ session.time }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="getConsultationStatusColor(session.status)" variant="soft" size="md" class="rounded-full">
            {{ getConsultationStatusLabel(session.status) }}
          </UBadge>
        </div>
      </li>
    </ul>
  </AppCard>
</template>
