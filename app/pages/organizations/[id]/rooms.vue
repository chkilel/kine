<script setup lang="ts">
  import { LazyOrganizationRoomSlideover, LazyAppModalConfirm } from '#components'

  const overlay = useOverlay()
  const roomAddOverlay = overlay.create(LazyOrganizationRoomSlideover)
  const confirmModal = overlay.create(LazyAppModalConfirm)

  const queryParams = ref<RoomQuery>({ search: undefined })
  const { data: rooms, isLoading, error } = useRoomsList(queryParams)
  const { mutate: deleteRoom } = useDeleteRoom()

  const stats = computed(() => {
    const roomCount = rooms.value?.length || 0
    const accessibleRooms = rooms.value?.filter((r) => r.prm === 1).length || 0
    const totalCapacity = rooms.value?.reduce((sum, r) => sum + r.capacity, 0) || 0
    const equipmentCount = rooms.value?.reduce((sum, r) => sum + (r.equipment?.length || 0), 0) || 0

    return { roomCount, accessibleRooms, totalCapacity, equipmentCount }
  })

  async function handleAddRoom() {
    await roomAddOverlay.open({})
  }

  async function handleEditRoom(room: Room) {
    await roomAddOverlay.open({ room })
  }

  function handleDuplicateRoom(room: Room) {
    const toast = useToast()
    toast.add({
      title: 'Dupliquer la salle',
      description: `Duplication de "${room.name}"`,
      color: 'primary'
    })
  }

  async function handleDeleteRoom(room: Room) {
    const confirmed = await confirmModal.open({
      title: 'Supprimer la salle',
      message: `Êtes-vous sûr de vouloir supprimer "${room.name}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmColor: 'error',
      icon: 'i-lucide-triangle-alert'
    })

    if (confirmed) {
      deleteRoom({ roomId: room.id })
    }
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

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="text-primary size-8 animate-spin" />
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-12">
      <p class="text-error">Une erreur s'est produite lors du chargement des salles.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="room in rooms"
        :key="room.id"
        class="group hover:ring-primary/40 flex h-full min-h-25 flex-col overflow-hidden transition-all duration-200"
        :ui="{ root: 'divide-y-0', body: 'flex-1', footer: 'border-t border-default bg-muted' }"
      >
        <div class="flex flex-col gap-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                <UIcon name="i-lucide-bed" class="size-5" />
              </div>
              <div>
                <h3 class="text-base font-bold">{{ room.name }}</h3>
                <p class="text-muted mt-0.5 text-xs">
                  {{ room.area ? `${room.area} m²` : '' }}
                  {{ room.capacity ? `• ${room.capacity} pers.` : '' }}
                </p>
              </div>
            </div>
            <UBadge v-if="room.prm === 1" color="info" variant="subtle" size="sm">PMR</UBadge>
          </div>

          <div class="flex flex-col gap-4">
            <p v-if="room.description" class="text-muted line-clamp-2 text-sm">
              {{ room.description }}
            </p>
            <div v-if="room.equipment && room.equipment.length > 0" class="flex flex-wrap gap-2">
              <UBadge v-for="item in room.equipment" :key="item" color="neutral" variant="soft">
                {{ item }}
              </UBadge>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-muted text-xs" />
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
        class="h-full min-h-48 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
        :ui="{ body: 'h-full flex flex-col items-center justify-center gap-4 text-center' }"
        @click="handleAddRoom"
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
          <span class="text-2xl font-extrabold">{{ stats.roomCount }}</span>
        </div>
        <div class="flex flex-col gap-1 border-r">
          <span class="text-muted text-sm font-medium">Capacité totale</span>
          <span class="text-2xl font-extrabold">{{ stats.totalCapacity }}</span>
          <span class="text-info mt-0.5 text-xs font-medium">patients</span>
        </div>
        <div class="flex flex-col gap-1 border-r">
          <span class="text-muted text-sm font-medium">Salles PMR</span>
          <span class="text-2xl font-extrabold">{{ stats.accessibleRooms }}</span>
          <span class="text-success mt-0.5 text-xs font-medium">
            {{ stats.accessibleRooms > 0 ? 'Accessibles' : 'Non accessibles' }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted text-sm font-medium">Équipements</span>
          <span class="text-2xl font-extrabold">{{ stats.equipmentCount }}</span>
          <span class="text-muted text-xs">enregistrés</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
