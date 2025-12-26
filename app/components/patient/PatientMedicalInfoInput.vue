<script setup lang="ts">
  interface Props {
    label: string
    name: string
    placeholder: string
    badgeColor?: 'neutral' | 'primary' | 'error' | 'info'
  }
  const { name, label, placeholder, badgeColor = 'neutral' } = defineProps<Props>()
  const items = defineModel<string[]>({ required: true })
  const input = ref('')

  function addItem() {
    if (!input.value.trim()) return
    items.value.push(input.value.trim())
    input.value = ''
  }

  function removeItem(index: number) {
    items.value.splice(index, 1)
  }
</script>

<template>
  <UFormField :label="label" :name="name">
    <div class="space-y-2">
      <div v-if="items && items.length > 0" class="flex flex-wrap gap-2">
        <UBadge v-for="(item, index) in items" :key="index" :color="badgeColor" variant="subtle">
          {{ item }}
          <template #trailing>
            <UButton icon="i-lucide-x" size="xs" :color="badgeColor" variant="ghost" @click="removeItem(index)" />
          </template>
        </UBadge>
      </div>
      <div class="flex gap-2">
        <UInput v-model="input" :placeholder="placeholder" class="w-full flex-1" @keyup.enter="addItem" />
        <UButton size="sm" @click="addItem">
          <UIcon name="i-lucide-plus" />
        </UButton>
      </div>
    </div>
  </UFormField>
</template>
