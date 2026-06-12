<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CohortGroupDistribution from '@/components/track-admin/CohortGroupDistribution.vue'

const route = useRoute()
const cohortId = computed(() => Number(route.params.cohortId))
</script>

<template>
    <div class="h-screen bg-brand-surface flex flex-col p-6">
        <!-- Header -->
        <div class="mb-6 shrink-0">
            <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                Track Admin — Lab Groups
            </p>
            <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">
                Manage Lab Groups
            </h1>
            <hr class="mt-3 border-t border-neutral-300" />
        </div>

        <!-- Main Content -->
        <div class="flex-1 min-h-0 bg-white rounded-card border border-neutral-300 p-6">
            <CohortGroupDistribution 
                v-if="cohortId" 
                :cohort-id="cohortId" 
                @saved="$router.back()"
            />
        </div>
    </div>
</template>
