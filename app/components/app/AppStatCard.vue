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
  <div
    class="group/card relative flex flex-col gap-1 overflow-hidden rounded-lg p-4 shadow-sm transition-all hover:shadow-md"
    :class="[
      'ring-1 ring-inset',
      color === 'neutral' && 'bg-inverted/5 ring-inverted/10 hover:ring-inverted/30',
      color === 'primary' && 'bg-primary/10 ring-primary/10 hover:ring-primary/30',
      color === 'success' && 'bg-success/10 ring-success/10 hover:ring-success/30',
      color === 'info' && 'bg-info/10 ring-info/10 hover:ring-info/30',
      color === 'warning' && 'bg-warning/10 ring-warning/10 hover:ring-warning/30',
      color === 'error' && 'bg-error/10 ring-error/10 hover:ring-error/30',
      color === 'secondary' && 'bg-secondary/10 ring-secondary/10 hover:ring-secondary/30'
    ]"
  >
    <p
      class="relative z-10 text-sm leading-normal font-medium"
      :class="[color === 'neutral' && 'text-muted', color !== 'neutral' && `text-${color}`]"
    >
      {{ label }}
    </p>
    <p class="text-default relative z-10 text-4xl leading-tight font-bold">
      {{ value }}

      <span :class="['text-xs font-medium', color === 'neutral' ? 'text-muted' : `text-${color}`]">
        {{ unit }}
      </span>
    </p>
    <UIcon
      :name="icon"
      class="pointer-events-none absolute -right-2 -bottom-4 text-7xl transition-all duration-300 select-none group-hover/card:scale-105 group-hover/card:opacity-40"
      :class="['opacity-20', color === 'neutral' && 'text-muted', color !== 'neutral' && `text-${color}`]"
    />
  </div>
  <!-- <UCard v-if="reverse" class="group"> -->
  <!-- <div class="mb-2 flex items-center justify-between"> -->
  <!-- <p class="text-muted text-xs font-bold tracking-widest uppercase">{{ label }}</p> -->
  <!-- <AppIconBox -->
  <!-- :name="icon" -->
  <!-- :color="color" -->
  <!-- size="xl" -->
  <!-- :class="[ -->
  <!-- 'rounded-lg transition-colors', -->
  <!-- color === 'neutral' && 'group-hover:bg-accented', -->
  <!-- color === 'success' && 'group-hover:bg-success/20', -->
  <!-- color === 'info' && 'group-hover:bg-info/20', -->
  <!-- color === 'error' && 'group-hover:bg-error/20', -->
  <!-- color === 'warning' && 'group-hover:bg-warning/20', -->
  <!-- color === 'primary' && 'group-hover:bg-primary/20', -->
  <!-- color === 'secondary' && 'group-hover:bg-secondary/20' -->
  <!-- ]" -->
  <!-- /> -->
  <!-- </div> -->
  <!-- <div class="flex items-baseline gap-2"> -->
  <!-- <span class="text-3xl font-black">{{ value }}</span> -->
  <!-- <span :class="['text-xs font-medium', color === 'neutral' ? 'text-muted' : `text-${color}`]"> -->
  <!-- {{ unit }} -->
  <!-- </span> -->
  <!-- </div> -->
  <!-- </UCard> -->
  <!-- <UCard v-else :ui="{ body: 'p-4 sm:p-5 flex items-center gap-5', root: 'group shadow-sm' }"> -->
  <!-- <AppIconBox -->
  <!-- :name="icon" -->
  <!-- :color="color" -->
  <!-- size="xl" -->
  <!-- :class="[ -->
  <!-- 'size-12 justify-center rounded-lg transition-colors', -->
  <!-- color === 'neutral' && 'group-hover:bg-accented', -->
  <!-- color === 'success' && 'group-hover:bg-success/20', -->
  <!-- color === 'info' && 'group-hover:bg-info/20', -->
  <!-- color === 'error' && 'group-hover:bg-error/20', -->
  <!-- color === 'warning' && 'group-hover:bg-warning/20', -->
  <!-- color === 'primary' && 'group-hover:bg-primary/20', -->
  <!-- color === 'secondary' && 'group-hover:bg-secondary/20' -->
  <!-- ]" -->
  <!-- /> -->
  <!-- <div> -->
  <!-- <p class="text-muted text-sm font-medium uppercase">{{ label }}</p> -->
  <!-- <p class="text-default text-2xl font-bold"> -->
  <!-- {{ value }} -->
  <!-- <span class="text-toned text-sm font-normal">{{ unit }}</span> -->
  <!-- </p> -->
  <!-- </div> -->
  <!-- </UCard> -->
</template>
