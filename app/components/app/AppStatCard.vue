<script setup lang="ts">
  const props = defineProps<{
    label: string
    value: number | string
    unit: string
    icon: string
    color?: UIColor
    reverse?: boolean
  }>()

  const color = props.color ?? 'neutral'
</script>

<template>
  <UCard v-if="reverse" class="group">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-muted text-xs font-bold tracking-widest uppercase">{{ label }}</p>
      <AppIconBox
        :name="icon"
        :color="color"
        size="xl"
        :class="[
          'rounded-lg transition-colors',
          color === 'neutral' && 'group-hover:bg-accented',
          color === 'success' && 'group-hover:bg-success/20',
          color === 'info' && 'group-hover:bg-info/20',
          color === 'error' && 'group-hover:bg-error/20',
          color === 'warning' && 'group-hover:bg-warning/20',
          color === 'primary' && 'group-hover:bg-primary/20',
          color === 'secondary' && 'group-hover:bg-secondary/20'
        ]"
      />
    </div>
    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-black">{{ value }}</span>
      <span :class="['text-xs font-medium', color === 'neutral' ? 'text-muted' : `text-${color}`]">
        {{ unit }}
      </span>
    </div>
  </UCard>
  <UCard v-else :ui="{ body: 'p-4 sm:p-5 flex items-center gap-5', root: 'group shadow-sm' }">
    <AppIconBox
      :name="icon"
      :color="color"
      size="xl"
      :class="[
        'size-12 justify-center rounded-lg transition-colors',
        color === 'neutral' && 'group-hover:bg-accented',
        color === 'success' && 'group-hover:bg-success/20',
        color === 'info' && 'group-hover:bg-info/20',
        color === 'error' && 'group-hover:bg-error/20',
        color === 'warning' && 'group-hover:bg-warning/20',
        color === 'primary' && 'group-hover:bg-primary/20',
        color === 'secondary' && 'group-hover:bg-secondary/20'
      ]"
    />
    <div>
      <p class="text-muted text-sm font-medium uppercase">{{ label }}</p>
      <p class="text-default text-2xl font-bold">
        {{ value }}
        <span class="text-toned text-sm font-normal">{{ unit }}</span>
      </p>
    </div>
  </UCard>
</template>
