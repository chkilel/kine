<script setup lang="ts">
  const recentDocuments = [
    { name: 'Radio_Epaule_Post-Chute.pdf', date: '02 Oct. 2024', type: 'radiology', icon: 'i-lucide-file-image' },
    { name: 'Rapport_Medecin_Traitant.docx', date: '01 Oct. 2024', type: 'document', icon: 'i-lucide-file-text' }
  ]
</script>

<template>
  <UCard variant="outline">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold">Documents récents du plan</h2>
      <UButton
        variant="ghost"
        class=""
        @click="$router.push({ path: $route.path, query: { ...$route.query, tab: 'documents' } })"
      >
        Voir tous les documents
      </UButton>
    </div>
    <div class="space-y-3">
      <div v-for="doc in recentDocuments" :key="doc.name" class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon :name="doc.icon" class="text-primary text-xl" />
          <div>
            <p class="text-sm font-semibold">{{ doc.name }}</p>
            <p class="text-muted text-xs">{{ doc.date }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UButton variant="ghost" size="sm" icon="i-lucide-eye" square />
          <UButton variant="ghost" size="sm" icon="i-lucide-download" square />
        </div>
      </div>
    </div>
  </UCard>
</template>
