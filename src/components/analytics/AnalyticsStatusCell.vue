<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    status: 'at_risk' | 'on_track'
    reasons?: string[]
}>()

const config = computed(() => {
    if (props.status === 'at_risk') {
        return {
            label: 'At risk',
            dot: 'bg-[#92400E]',
            badge: 'bg-[#FEF3C7] text-[#92400E] border-[#92400E]',
        }
    }
    return {
        label: 'On track',
        dot: 'bg-[#2D6A4F]',
        badge: 'bg-[#D1FAE5] text-[#2D6A4F] border-[#2D6A4F]',
    }
})
</script>

<template>
    <div class="min-w-[140px]">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full shrink-0" :class="config.dot" />
            <span
                class="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-medium tracking-[1px] uppercase border"
                :class="config.badge"
            >
                {{ config.label }}
            </span>
        </div>
        <p v-if="reasons?.length" class="font-sans text-[12px] text-[#888888] mt-1.5 leading-relaxed">
            {{ reasons.join(' · ') }}
        </p>
    </div>
</template>
