<script setup lang="ts">
defineProps<{
    label: string
    initials: string
}>()
</script>

<template>
    <div class="flex items-center gap-3 min-w-0">
        <span
            class="w-9 h-9 rounded-full bg-[#940002] text-[#E6DDD4] font-sans text-xs font-medium flex items-center justify-center shrink-0"
        >
            {{ initials }}
        </span>
        <span class="text-[14px] font-medium text-[#1A0000] truncate">
            {{ label }}
        </span>
    </div>
</template>
