<script setup lang="ts">
  interface Props {
    modelValue?: string | null
    disabled?: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:modelValue': [value: string | null]
  }>()

  const queryParams = ref<InsuranceCompanyQuery>({ status: 'active', limit: 100, page: 1 })
  const { data: response, isLoading } = useInsuranceCompaniesList(queryParams)

  const companies = computed(() => response.value?.data || [])

  const options = computed(() =>
    companies.value.map((company) => ({
      label: `${company.name} (${company.code})`,
      value: company.id,
      description: `Couverture: ${company.coveragePercentage}% | Prix: ${company.sessionPriceCents / 100} DH`
    }))
  )

  const selectValue = computed(() => props.modelValue ?? undefined)
</script>

<template>
  <USelectMenu
    :model-value="selectValue"
    :items="options"
    value-key="value"
    label-key="label"
    placeholder="Sélectionner une compagnie d'assurance"
    :disabled="disabled"
    :loading="isLoading"
    class="w-full"
    @update:model-value="emit('update:modelValue', $event ?? null)"
  >
    <template #item-label="{ item }">
      <div class="flex flex-col">
        <span class="font-medium">{{ item.label }}</span>
        <span class="text-xs text-gray-500">{{ item.description }}</span>
      </div>
    </template>
  </USelectMenu>
</template>
