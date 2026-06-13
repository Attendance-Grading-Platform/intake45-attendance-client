<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    name: string
    size?: 'md' | 'lg'
}>(), {
    size: 'lg',
})

const initials = computed(() =>
    props.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase(),
)

const sizeClass = computed(() =>
    props.size === 'lg' ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs',
)
</script>

<template>
    <span
        class="rounded-full bg-[#940002] text-[#E6DDD4] font-sans font-medium flex items-center justify-center select-none shrink-0"
        :class="sizeClass"
    >
        {{ initials }}
    </span>
</template>
