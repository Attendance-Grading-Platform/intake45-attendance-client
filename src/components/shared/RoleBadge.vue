<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    role: string
}>()

const badgeConfig = computed(() => {
    switch (props.role) {
        case 'branch_manager':
            return { label: 'Branch Manager', class: 'bg-purple-100 text-purple-800 border-purple-200' }
        case 'track_admin':
            return { label: 'Track Admin', class: 'bg-blue-100 text-blue-800 border-blue-200' }
        case 'instructor':
            return { label: 'Instructor', class: 'bg-amber-100 text-amber-800 border-amber-200' }
        case 'student':
            return { label: 'Student', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
        default:
            return { label: props.role, class: 'bg-neutral-100 text-neutral-800 border-neutral-200' }
    }
})
</script>

<template>
    <span 
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium tracking-wide uppercase border"
        :class="badgeConfig.class"
    >
        {{ badgeConfig.label }}
    </span>
</template>