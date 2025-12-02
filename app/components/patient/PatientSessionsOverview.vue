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
  <UCard variant="outline">
    <h2 class="mb-5 text-lg font-bold">Aperçu des prochaines/dernières séances</h2>
    <div class="flow-root">
      <ul class="divide-default -my-4 divide-y">
        <li v-for="session in upcomingSessions" :key="session.date" class="flex items-center justify-between py-4">
          <div class="flex items-center gap-4">
            <div class="w-12 text-center">
              <p class="text-sm font-bold">{{ session.date }}</p>
              <p class="text-muted text-xs">{{ session.month }}</p>
            </div>
            <div>
              <p class="font-semibold">{{ session.type }}</p>
              <p class="text-muted text-sm">{{ session.time }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="getSessionStatusColor(session.status)" variant="soft" size="sm">
              {{ getSessionStatusLabel(session.status) }}
            </UBadge>
            <UButton variant="ghost" size="sm" icon="i-lucide-eye" square />
          </div>
        </li>
      </ul>
    </div>
  </UCard>
</template>
