<script setup lang="ts">
import type { AttendanceGridCell } from '@/composables/useTrackAdminDashboard'

defineProps<{
    grid: AttendanceGridCell[][]
    dayLabels: string[]
}>()

function cellClass(status: AttendanceGridCell['status']): string {
    switch (status) {
        case 'attended':
            return 'bg-[#1A0000]'
        case 'missed':
            return 'bg-[#E6DDD4]'
        default:
            return 'bg-[#F0EBE6]'
    }
}
</script>

<template>
    <div class="space-y-3">
        <div class="grid grid-cols-5 gap-2">
            <div
                v-for="day in dayLabels"
                :key="day"
                class="text-center font-sans text-[10px] uppercase tracking-[1.5px] text-[#888888]"
            >
                {{ day }}
            </div>
        </div>

        <div
            v-for="(row, rowIndex) in grid"
            :key="rowIndex"
            class="grid grid-cols-5 gap-2"
        >
            <div
                v-for="(cell, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="aspect-square rounded-[4px] transition-colors"
                :class="cellClass(cell.status)"
                :title="`${cell.label}: ${cell.status}`"
            />
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-2">
            <div class="flex items-center gap-2 text-[11px] text-[#666666]">
                <span class="w-3 h-3 rounded-[2px] bg-[#1A0000]" />
                Attended
            </div>
            <div class="flex items-center gap-2 text-[11px] text-[#666666]">
                <span class="w-3 h-3 rounded-[2px] bg-[#E6DDD4]" />
                Missed
            </div>
            <div class="flex items-center gap-2 text-[11px] text-[#666666]">
                <span class="w-3 h-3 rounded-[2px] bg-[#F0EBE6]" />
                No session
            </div>
        </div>
    </div>
</template>
