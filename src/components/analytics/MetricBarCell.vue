<script setup lang="ts">
defineProps<{
    value: number
    colorClass?: string
    suffix?: string
}>()

function barWidth(value: number): string {
    return `${Math.min(100, Math.max(0, value))}%`
}
</script>

<template>
    <div class="flex items-center gap-3 w-[148px]">
        <div class="flex-1 h-[6px] bg-[#E6DDD4] rounded-full overflow-hidden">
            <div
                class="h-full bg-[#940002] rounded-full transition-all"
                :style="{ width: barWidth(value) }"
            />
        </div>
        <span
            class="text-[13px] font-medium tabular-nums w-12 text-right shrink-0"
            :class="colorClass"
        >
            {{ value }}{{ suffix ?? '%' }}
        </span>
    </div>
</template>
