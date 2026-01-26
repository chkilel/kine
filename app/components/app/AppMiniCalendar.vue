<script setup lang="ts">
  import {
    addDays,
    addWeeks,
    format,
    isSameDay,
    isBefore,
    startOfWeek,
    eachDayOfInterval,
    startOfDay,
    compareAsc
  } from 'date-fns'

  const props = defineProps<{
    currentDate: string
    disablePreviousWeek?: boolean
  }>()

  const emit = defineEmits<{
    selectDate: [date: string]
  }>()

  const handleSelectDate = (date: Date) => {
    emit('selectDate', format(date, 'yyyy-MM-dd'))
  }

  const weekStart = computed(() => startOfWeek(new Date(props.currentDate), { weekStartsOn: 1 }))
  const weekDates = computed(() => {
    const start = weekStart.value
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  })
  const isPreviousWeekDisabled = computed(() => {
    return props.disablePreviousWeek && compareAsc(weekStart.value, startOfDay(new Date())) <= 0
  })
  const handlePreviousWeek = () => {
    const previousWeekStart = addWeeks(weekStart.value, -1)
    handleSelectDate(previousWeekStart)
  }
  const handleNextWeek = () => {
    const nextWeekStart = addWeeks(weekStart.value, 1)
    handleSelectDate(nextWeekStart)
  }
</script>

<template>
  <div class="flex items-stretch gap-1">
    <UButton
      icon="i-hugeicons-arrow-left-01"
      variant="ghost"
      :disabled="isPreviousWeekDisabled"
      @click="handlePreviousWeek"
    />
    <div class="flex gap-0.5 overflow-x-auto">
      <UButton
        v-for="date in weekDates"
        :key="format(date, 'yyyy-MM-dd')"
        :color="isSameDay(date, new Date(currentDate)) ? 'primary' : 'neutral'"
        :variant="isSameDay(date, new Date(currentDate)) ? 'solid' : 'ghost'"
        class="h-12.5 min-w-11 flex-col justify-center gap-0.5 p-2"
        size="lg"
        @click="handleSelectDate(date)"
      >
        <span class="text-[10px] tracking-wide uppercase">
          {{ extractDayAndMonth(date.toISOString()).dayNameShort }}
        </span>
        <span class="text-sm leading-none font-bold">
          {{ extractDayAndMonth(date.toISOString()).day }}
        </span>
      </UButton>
    </div>
    <UButton icon="i-hugeicons-arrow-right-01" variant="ghost" @click="handleNextWeek" />
  </div>
</template>
