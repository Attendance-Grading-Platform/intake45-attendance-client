<script setup lang="ts">
defineProps<{
    label: string
    title: string
}>()
</script>

<template>
    <header class="mb-8">
        <p class="font-sans text-label text-[#888888] tracking-[1.5px] uppercase mb-2">
            {{ label }}
        </p>
        <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">
            {{ title }}
        </h1>
        <hr class="border-[#C9BDB8] mt-4" />
    </header>
</template>
