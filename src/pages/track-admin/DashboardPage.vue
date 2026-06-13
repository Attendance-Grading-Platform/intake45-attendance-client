<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTrackAdminDashboard } from '@/composables/useTrackAdminDashboard'
import AttendanceWeekGrid from '@/components/dashboard/AttendanceWeekGrid.vue'
import GradeDistributionBars from '@/components/dashboard/GradeDistributionBars.vue'

const router = useRouter()

const {
    cohorts,
    selectedCohortId,
    selectedCohort,
    loading,
    error,
    enrolledCount,
    sessionsThisWeek,
    ungradedCount,
    atRiskCount,
    gradeBuckets,
    maxBucketCount,
    attendanceGrid,
    weekDayLabels,
    fetchDashboard,
    selectCohort,
} = useTrackAdminDashboard()

function goToOverview(): void {
    if (!selectedCohortId.value) return
    router.push({
        name: 'track-admin-cohort-overview',
        params: { cohortId: selectedCohortId.value },
    })
}

onMounted(() => fetchDashboard())
</script>

<template>
    <div class="min-h-screen bg-brand-surface p-6 max-w-7xl mx-auto">
        <header class="mb-8">
            <div class="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                        {{ selectedCohort?.track?.name ?? 'Track' }} · {{ selectedCohort?.name ?? 'Cohort' }}
                    </p>
                    <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">
                        Cohort overview
                    </h1>
                </div>

                <div v-if="cohorts.length > 1" class="w-56">
                    <label class="block font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                        Cohort
                    </label>
                    <select
                        :value="selectedCohortId ?? ''"
                        class="w-full h-[40px] px-3 rounded-[6px] border border-[#C9BDB8] bg-white font-sans text-[14px] text-[#1A0000]"
                        @change="selectCohort(Number(($event.target as HTMLSelectElement).value))"
                    >
                        <option v-for="cohort in cohorts" :key="cohort.id" :value="cohort.id">
                            {{ cohort.name }}
                        </option>
                    </select>
                </div>
            </div>
            <hr class="mt-4 border-t border-neutral-300" />
        </header>

        <div
            v-if="error && !loading"
            class="mb-6 p-4 rounded-[10px] border border-[#991B1B] bg-[#FEE2E2] text-[#991B1B] font-sans text-[14px] flex items-center justify-between gap-3"
        >
            <span>{{ error }}</span>
            <button
                type="button"
                class="h-[34px] px-3 text-[13px] font-medium border border-[#991B1B] rounded-[6px] hover:bg-white"
                @click="fetchDashboard"
            >
                Retry
            </button>
        </div>

        <div v-if="loading" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div v-for="n in 4" :key="n" class="bg-white rounded-card border border-neutral-300 p-6 animate-pulse h-24" />
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-card border border-neutral-300 p-6 animate-pulse h-72" />
                <div class="bg-white rounded-card border border-neutral-300 p-6 animate-pulse h-72" />
            </div>
        </div>

        <div v-else-if="cohorts.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
            <p class="text-4xl mb-4">📂</p>
            <p class="text-neutral-500 font-sans">You have not been assigned to any cohort yet.</p>
        </div>

        <template v-else-if="!error">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-white rounded-card border border-neutral-300 p-6">
                    <p class="font-sans text-[32px] font-medium text-neutral-900 tabular-nums leading-none">
                        {{ enrolledCount }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Enrolled</p>
                </div>
                <div class="bg-white rounded-card border border-neutral-300 p-6">
                    <p class="font-sans text-[32px] font-medium text-neutral-900 tabular-nums leading-none">
                        {{ sessionsThisWeek }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Sessions this week</p>
                </div>
                <div class="bg-white rounded-card border border-neutral-300 p-6">
                    <p class="font-sans text-[32px] font-medium text-[#92400E] tabular-nums leading-none">
                        {{ ungradedCount }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Ungraded submissions</p>
                </div>
                <div class="bg-white rounded-card border border-neutral-300 p-6">
                    <p
                        class="font-sans text-[32px] font-medium tabular-nums leading-none"
                        :class="atRiskCount > 0 ? 'text-[#92400E]' : 'text-[#2D6A4F]'"
                    >
                        {{ atRiskCount }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">At-risk count</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <section class="bg-white rounded-card border border-neutral-300 p-6">
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Grade distribution</p>
                    <h2 class="font-serif text-[22px] text-neutral-900 mb-6">Student GPA buckets</h2>
                    <GradeDistributionBars :buckets="gradeBuckets" :max-count="maxBucketCount" />
                </section>

                <section class="bg-white rounded-card border border-neutral-300 p-6">
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Attendance this week</p>
                    <h2 class="font-serif text-[22px] text-neutral-900 mb-6">Session grid</h2>
                    <AttendanceWeekGrid :grid="attendanceGrid" :day-labels="weekDayLabels" />
                </section>
            </div>

            <div class="flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    class="h-[40px] px-5 rounded-[6px] bg-[#940002] text-white font-sans text-[14px] hover:brightness-110 transition-all"
                    @click="goToOverview"
                >
                    Open cohort overview
                </button>
                <button
                    type="button"
                    class="h-[40px] px-5 rounded-[6px] border border-[#C9BDB8] font-sans text-[14px] text-[#1A0000] hover:bg-white transition-colors"
                    @click="router.push({ name: 'track-admin-students' })"
                >
                    View roster
                </button>
                <button
                    v-if="ungradedCount > 0"
                    type="button"
                    class="h-[40px] px-5 rounded-[6px] border border-[#D97706] text-[#92400E] font-sans text-[14px] hover:bg-[#FFFBEB] transition-colors"
                    @click="router.push({ name: 'track-admin-grades' })"
                >
                    Review ungraded work
                </button>
            </div>
        </template>
    </div>
</template>
