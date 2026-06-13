<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    role: string
}>()

const badgeConfig = computed(() => {
    switch (props.role) {
        case 'branch_manager':
            return {
                label: 'Branch Manager',
                class: 'bg-[#940002] text-[#E6DDD4] border-[#940002]',
            }
        case 'track_admin':
            return {
                label: 'Track Admin',
                class: 'bg-white text-[#940002] border-[#940002]',
            }
        case 'instructor':
            return {
                label: 'Instructor',
                class: 'bg-white text-[#666666] border-[#C9BDB8]',
            }
        case 'student':
            return {
                label: 'Student',
                class: 'bg-[#F5EDEA] text-[#666666] border-[#C9BDB8]',
            }
        default:
            return {
                label: props.role,
                class: 'bg-[#F5EDEA] text-[#666666] border-[#C9BDB8]',
            }
    }
})
</script>

<template>
    <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[11px] font-sans font-medium tracking-[1.5px] uppercase border"
        :class="badgeConfig.class"
    >
        {{ badgeConfig.label }}
    </span>
</template>
