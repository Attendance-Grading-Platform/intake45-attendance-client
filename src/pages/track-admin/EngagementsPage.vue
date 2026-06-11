<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCohortStore } from '@/stores/cohort.store'
import EngagementScheduler from '@/components/track-admin/EngagementScheduler.vue'

const cohortStore = useCohortStore()
const selectedCohortId = ref<number | null>(null)

onMounted(async () => {
    if (cohortStore.cohorts.length === 0) {
        await cohortStore.fetchCohorts()
    }

    const active = cohortStore.cohorts.find(c => c.status === 'active') || cohortStore.cohorts[0]
    if (active) {
        selectedCohortId.value = active.id
    }
})
</script>

<template>
    <div class="min-h-screen bg-[#F5F0E8] p-4 md:p-6">
        <div v-if="cohortStore.cohorts.length > 1" class="mb-4 flex justify-end">
            <div class="relative">
                <select
                    v-model="selectedCohortId"
                    class="appearance-none bg-white border border-gray-200 rounded-lg px-4 pr-10 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8B1A1A]"
                >
                    <option v-for="c in cohortStore.cohorts" :key="c.id" :value="c.id">
                        {{ c.name }}
                    </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>

        <EngagementScheduler
            v-if="selectedCohortId"
            :key="selectedCohortId"
            :cohort-id="selectedCohortId"
        />

        <div
            v-else
            class="bg-white rounded-2xl shadow-sm p-12 text-center"
        >
            <p class="text-sm text-gray-500">
                No cohort assigned. Contact your branch manager.
            </p>
        </div>
    </div>
</template>
