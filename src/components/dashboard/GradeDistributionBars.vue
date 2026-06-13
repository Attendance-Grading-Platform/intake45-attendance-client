<script setup lang="ts">
import type { GradeBucket } from '@/composables/useTrackAdminDashboard'

defineProps<{
    buckets: GradeBucket[]
    maxCount: number
}>()
</script>

<template>
    <div class="space-y-4">
        <div
            v-for="bucket in buckets"
            :key="bucket.label"
            class="flex items-end gap-3"
        >
            <div class="w-14 font-sans text-[11px] text-[#666666] tabular-nums">
                {{ bucket.label }}
            </div>
            <div class="flex-1 flex items-end gap-2 min-h-[120px]">
                <div class="flex flex-col items-center justify-end flex-1">
                    <span class="font-sans text-[12px] text-[#888888] mb-1 tabular-nums">
                        {{ bucket.count }}
                    </span>
                    <div
                        class="w-full max-w-[48px] rounded-t-[4px] transition-all duration-500"
                        :style="{
                            height: `${Math.max(8, (bucket.count / maxCount) * 100)}px`,
                            backgroundColor: bucket.color,
                        }"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
