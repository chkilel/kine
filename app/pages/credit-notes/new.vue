<script setup lang="ts">
  definePageMeta({
    layout: 'default'
  })

  const router = useRouter()
  const route = useRoute()
  const patientId = (route.query.patientId as string) || ''
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 py-8">
    <div class="flex items-center gap-3">
      <UButton icon="i-hugeicons-arrow-left-02" variant="ghost" @click="router.back()" />
      <h1 class="text-2xl font-bold">Nouvel avoir</h1>
    </div>

    <CreditNoteCreateForm
      :patient-id="patientId"
      @created="(creditNote) => router.push(`/credit-notes/${creditNote.id}`)"
    />
  </div>
</template>
