<script setup lang="ts">
  import { LazyOrganizationRoomSlideover } from '#components'

  interface Room {
    id: string
    name: string
    location: string
    description: string
    status: 'available' | 'occupied' | 'maintenance'
    equipment: string[]
    sessionsToday: number
    icon: string
    color: string
  }

  const overlay = useOverlay()
  const roomAddOverlay = overlay.create(LazyOrganizationRoomSlideover)

  const rooms = ref<Room[]>([
    {
      id: '1',
      name: 'Salle de traitement 1',
      location: 'Rez-de-chaussée',
      description: 'Idéale pour la rééducation individuelle et les massages thérapeutiques.',
      status: 'available',
      equipment: ['Table électrique', 'Tabouret'],
      sessionsToday: 5,
      icon: 'i-lucide-bed',
      color: 'primary'
    },
    {
      id: '2',
      name: 'Gymnase Rééducation',
      location: 'Aile Est',
      description: 'Espace ouvert pour les exercices de groupe et la réathlétisation.',
      status: 'occupied',
      equipment: ['Tapis de course', 'Espalier', '+3'],
      sessionsToday: 8,
      icon: 'i-lucide-dumbbell',
      color: 'warning'
    },
    {
      id: '3',
      name: 'Salle Balnéothérapie',
      location: 'Sous-sol',
      description: 'Bassin chauffé pour la rééducation aquatique.',
      status: 'maintenance',
      equipment: ['Bassin 10m', 'Jets massants'],
      sessionsToday: 0,
      icon: 'i-lucide-waves',
      color: 'info'
    },
    {
      id: '4',
      name: 'Salle de traitement 2',
      location: 'Rez-de-chaussée',
      description: 'Salle standard pour consultations et soins manuels.',
      status: 'available',
      equipment: ['Table manuelle', 'Bureau'],
      sessionsToday: 4,
      icon: 'i-lucide-bed',
      color: 'primary'
    }
  ])

  const statusConfig = {
    available: { color: 'success' as const, label: 'Disponible' },
    occupied: { color: 'error' as const, label: 'Occupée' },
    maintenance: { color: 'neutral' as const, label: 'Maintenance' }
  }

  const toast = useToast()

  async function handleAddRoom() {
    await roomAddOverlay.open({})
  }

  function handleEditRoom(room: Room) {
    toast.add({
      title: 'Modifier la salle',
      description: `Modification de "${room.name}"`,
      color: 'primary'
    })
  }

  function handleDuplicateRoom(room: Room) {
    toast.add({
      title: 'Dupliquer la salle',
      description: `Duplication de "${room.name}"`,
      color: 'primary'
    })
  }

  function handleDeleteRoom(room: Room) {
    toast.add({
      title: 'Supprimer la salle',
      description: `Suppression de "${room.name}"`,
      color: 'error'
    })
  }
</script>

<template>
  <div class="flex flex-col gap-6 pt-6">
    <UCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-bold">Salles du cabinet</h2>
          <p class="text-muted mt-1 text-sm">Gérer les salles de traitement et les équipements associés.</p>
        </div>
        <UButton icon="i-lucide-plus" color="primary" variant="soft" @click="handleAddRoom">
          Ajouter une nouvelle salle
        </UButton>
      </div>
    </UCard>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="room in rooms"
        :key="room.id"
        class="group hover:ring-primary/40 flex h-full min-h-25 flex-col overflow-hidden transition-all duration-200"
        :ui="{ root: 'divide-y-0', body: 'flex-1', footer: 'border-t border-default bg-muted' }"
      >
        <div class="flex flex-col gap-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full"
                :class="`bg-${room.color}/10 text-${room.color}`"
              >
                <UIcon :name="room.icon" class="size-5" />
              </div>
              <div>
                <h3 class="text-base font-bold">{{ room.name }}</h3>
                <p class="text-muted mt-0.5 text-xs">{{ room.location }}</p>
              </div>
            </div>
            <UBadge :color="statusConfig[room.status].color" variant="subtle" size="sm">
              {{ statusConfig[room.status].label }}
            </UBadge>
          </div>

          <div class="flex flex-col gap-4">
            <p class="text-muted line-clamp-2 text-sm">{{ room.description }}</p>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="item in room.equipment" :key="item" color="neutral" variant="soft">
                {{ item }}
              </UBadge>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-muted flex items-center gap-1.5 text-xs font-medium">
              <UIcon name="i-lucide-calendar" class="size-4" />
              {{ room.sessionsToday }} séances auj.
            </div>
            <div class="flex gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="primary"
                variant="ghost"
                size="sm"
                square
                @click="handleEditRoom(room)"
              />
              <UButton
                icon="i-lucide-copy"
                color="primary"
                variant="ghost"
                size="sm"
                square
                @click="handleDuplicateRoom(room)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                square
                @click="handleDeleteRoom(room)"
              />
            </div>
          </div>
        </template>
      </UCard>

      <UCard
        class="h-full min-h-25 opacity-60 transition-opacity hover:opacity-100"
        :ui="{ body: 'h-full flex flex-col items-center justify-center gap-4 text-center' }"
      >
        <div class="bg-muted text-muted flex size-12 items-center justify-center rounded-full">
          <UIcon name="i-lucide-plus" class="size-6" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-bold">Ajouter une salle</h3>
          <p class="text-muted mt-1 text-xs">Configurer un nouvel espace</p>
        </div>
      </UCard>
    </div>

    <UCard variant="outline">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-square-chart-gantt" class="text-primary size-6" />
        <h2 class="text-lg font-bold">Statistiques des Salles</h2>
      </div>
      <div class="divide-default mt-6 grid grid-cols-2 gap-8 lg:grid-cols-4">
        <div class="flex flex-col gap-1 border-r">
          <span class="text-muted text-sm font-medium">Total Salles</span>
          <span class="text-2xl font-extrabold">4</span>
        </div>
        <div class="flex flex-col gap-1 border-r">
          <span class="text-muted text-sm font-medium">Utilisation moyenne</span>
          <span class="text-2xl font-extrabold">75%</span>
          <span class="text-success mt-0.5 flex items-center text-xs font-medium">
            <UIcon name="i-lucide-trending-up" class="mr-1 size-3" />
            +12% cette sem.
          </span>
        </div>
        <div class="flex flex-col gap-1 border-r">
          <span class="text-muted text-sm font-medium">La plus utilisée</span>
          <span class="truncate text-2xl font-extrabold" title="Salle de traitement 1">Salle 1</span>
          <span class="text-muted text-xs">32h / semaine</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted text-sm font-medium">La moins utilisée</span>
          <span class="truncate text-2xl font-extrabold" title="Salle Balnéothérapie">Balnéo</span>
          <span class="text-error mt-0.5 flex items-center text-xs font-medium">
            <UIcon name="i-lucide-alert-triangle" class="mr-1 size-3" />
            Maintenance
          </span>
        </div>
      </div>
    </UCard>
  </div>
</template>
