<script setup lang="ts">
  definePageMeta({
    layout: 'default'
  })

  const { data: creditNotes, isLoading } = useCreditNotes()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Avoirs</h1>
      <UButton to="/credit-notes/new" label="Nouvel avoir" icon="i-hugeicons-plus" />
    </div>

    <div v-if="isLoading" class="text-dimmed py-8 text-center">Chargement...</div>

    <div v-else-if="!creditNotes?.data?.length" class="text-dimmed py-8 text-center">Aucun avoir trouvé</div>

    <div v-else class="space-y-3">
      <div v-for="note in creditNotes.data" :key="note.id" class="border-default bg-default rounded-lg border p-4">
        <NuxtLink :to="`/credit-notes/${note.id}`" class="flex items-center justify-between">
          <div>
            <div class="font-medium">{{ note.referenceNumber }}</div>
            <div class="text-dimmed text-sm">{{ note.reason }}</div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge
              :label="note.status === 'draft' ? 'Brouillon' : note.status === 'issued' ? 'Émis' : 'Annulé'"
              :color="note.status === 'issued' ? 'success' : note.status === 'cancelled' ? 'error' : 'neutral'"
              variant="subtle"
            />
            <span class="font-medium">{{ formatCurrency(note.amountCents) }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
