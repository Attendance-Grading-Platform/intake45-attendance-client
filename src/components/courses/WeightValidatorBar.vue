<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    total: number
}>()

const barColor = computed(() => {
    if (props.total === 100) return 'bg-success'
    if (props.total > 100) return 'bg-danger'
    return 'bg-warning'
})

const barWidth = computed(() => `${Math.min(props.total, 100)}%`)

const statusText = computed(() => {
    if (props.total === 100) return '100 / 100 ✓ Perfect'
    if (props.total > 100) return `${props.total} / 100 — ${props.total - 100} points over limit`
    return `${props.total} / 100 — ${100 - props.total} points remaining`
})

const statusClass = computed(() => {
    if (props.total === 100) return 'text-success'
    if (props.total > 100) return 'text-danger'
    return 'text-warning'
})
</script>

<template>
    <div class="space-y-2">
        <div class="h-1.5 w-full rounded-full bg-brand-surface overflow-hidden">
            <div
                class="h-full rounded-full transition-all duration-200"
                :class="barColor"
                :style="{ width: barWidth }"
            />
        </div>
        <p class="font-sans text-sm tabular-nums" :class="statusClass">
            {{ statusText }}
        </p>
    </div>
</template>
