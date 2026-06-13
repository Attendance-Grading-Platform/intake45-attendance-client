<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCohortStore } from '@/stores/cohort.store'
import EngagementScheduler from '@/components/track-admin/EngagementScheduler.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const cohortStore = useCohortStore()
const selectedCohortId = ref<number | null>(null)

const cohortOptions = computed(() =>
    cohortStore.cohorts.map((c) => ({ label: c.name, value: c.id })),
)

onMounted(async () => {
    if (cohortStore.cohorts.length === 0) {
        await cohortStore.fetchCohorts()
    }
    const active = cohortStore.cohorts.find((c) => c.status === 'active')
    selectedCohortId.value = active?.id ?? cohortStore.cohorts[0]?.id ?? null
})
</script>

<template>
    <div class="min-h-full">
        <div v-if="cohortStore.isLoading" class="py-20 text-center font-sans text-[14px] text-[#888888]">
            Loading cohorts…
        </div>

        <div
            v-else-if="!selectedCohortId || cohortOptions.length === 0"
            class="bg-white rounded-[10px] border border-[#C9BDB8] p-12 text-center max-w-lg mx-auto mt-10"
        >
            <p class="font-serif text-[26px] text-[#1A0000] mb-2">No cohort assigned</p>
            <p class="font-sans text-[14px] text-[#666666]">
                You need an active cohort before scheduling engagements.
            </p>
        </div>

        <template v-else>
            <div class="flex flex-wrap items-end justify-between gap-4 mb-2">
                <PageHeader label="Scheduling" title="Engagements &amp; sessions" />
                <div v-if="cohortOptions.length > 1" class="w-52 pb-1">
                    <SelectInput
                        v-model="selectedCohortId"
                        label="Cohort"
                        :options="cohortOptions"
                    />
                </div>
            </div>

            <EngagementScheduler
                :key="selectedCohortId"
                :cohort-id="selectedCohortId"
            />
        </template>
    </div>
</template>
