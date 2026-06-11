<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import type { CohortRow } from '@/types/cohort.types'

const router = useRouter()
const cohorts = ref<CohortRow[]>([])
const loading = ref(true)

onMounted(async () => {
    try {
        const res = await api.get('/v1/cohorts')
        cohorts.value = res.data.data ?? []
    } catch (err) {
        console.error('Failed to load cohorts', err)
    } finally {
        loading.value = false
    }
})

function goToOverview(cohort: CohortRow) {
    router.push({
        name: 'track-admin-cohort-overview',
        params: { cohortId: cohort.id }
    })
}
</script>

<template>
    <div class="min-h-screen bg-brand-surface p-6">
        <!-- Header -->
        <div class="mb-6">
            <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                Track Admin
            </p>
            <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">
                My Cohorts
            </h1>
            <hr class="mt-3 border-t border-neutral-300" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="i in 2" :key="i" class="bg-white rounded-card border border-neutral-300 p-6 animate-pulse h-32" />
        </div>

        <!-- Empty -->
        <div v-else-if="cohorts.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
            <p class="text-4xl mb-4">📂</p>
            <p class="text-neutral-500 font-sans">You have not been assigned to any cohort yet.</p>
        </div>

        <!-- Cohort Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <button
                v-for="cohort in cohorts"
                :key="cohort.id"
                class="text-left bg-white rounded-card border border-neutral-300 p-6 hover:border-brand-red hover:shadow-md transition-all group"
                @click="goToOverview(cohort)"
            >
                <div class="flex justify-between items-start mb-3">
                    <h2 class="font-sans text-[16px] font-semibold text-neutral-800 group-hover:text-brand-red transition-colors">
                        {{ cohort.name }}
                    </h2>
                    <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        :class="cohort.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-200 text-neutral-500'"
                    >
                        {{ cohort.status }}
                    </span>
                </div>

                <p class="text-sm text-neutral-500 font-sans mb-4">
                    {{ cohort.track?.name ?? 'No track' }}
                </p>

                <div class="flex items-center gap-4 text-xs text-neutral-400 font-sans">
                    <span>👥 {{ cohort.students_count }} students</span>
                    <span>📅 {{ cohort.started_at ? new Date(cohort.started_at).toLocaleDateString() : '—' }}</span>
                </div>

                <div class="mt-4 flex items-center gap-1 text-xs text-brand-red font-medium font-sans">
                    View Cohort Overview
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
            </button>
        </div>
    </div>
</template>
