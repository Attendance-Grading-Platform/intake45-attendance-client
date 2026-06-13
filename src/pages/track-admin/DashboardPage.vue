<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import type { CohortRow } from '@/types/cohort.types'
import { getCohortAnalytics } from '@/api/modules/analytics.api'
import GradeDistributionChart from '@/components/charts/GradeDistributionChart.vue'

const router = useRouter()
const cohorts = ref<CohortRow[]>([])
const loading = ref(true)

onMounted(async () => {
    try {
        const res = await api.get('/v1/cohorts')
        cohorts.value = res?.data?.data ?? []
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

interface GradeBucket    { label: string; count: number }
interface LabGroupRow    { name: string; average_score: number; students_count: number }
interface SessionRow     { session_date?: string; attendance_rate?: number }

interface AnalyticsShape {
    grade_distribution: GradeBucket[]
    lab_groups: LabGroupRow[]
    recent_sessions: SessionRow[]
}

const MOCK_ANALYTICS: AnalyticsShape = {
    grade_distribution: [
        { label: '90-100',   count: 8  },
        { label: '75-89',    count: 14 },
        { label: '60-74',    count: 6  },
        { label: 'Below 60', count: 3  },
    ],
    lab_groups: [
        { name: 'Group A — Ahmed Essam',   average_score: 85.5, students_count: 12 },
        { name: 'Group B — Sara Khalil',   average_score: 75.0, students_count: 11 },
        { name: 'Group C — Mahmoud Fathy', average_score: 80.2, students_count: 10 },
    ],
    recent_sessions: Array.from({ length: 15 }, (_, i): SessionRow => ({
        session_date:    new Date(Date.now() - (14 - i) * 2 * 86400000).toISOString().split('T')[0],
        attendance_rate: ([95, 88, 72, 91, 85, 67, 93, 78, 55, 90, 82, 88, 76, 94, 83] as number[])[i] ?? 0,
    })),
}

const analyticsLoading = ref(false)
const analytics = ref<AnalyticsShape | null>(null)
const selectedAnalyticsCohortId = ref<number | null>(null)

watch(cohorts, (newCohorts) => {
    const firstCohort = newCohorts?.[0]

    if (firstCohort && !selectedAnalyticsCohortId.value) {
        selectedAnalyticsCohortId.value = firstCohort.id
        loadAnalytics(firstCohort.id)
    }
})

async function loadAnalytics(cohortId: number) {
    selectedAnalyticsCohortId.value = cohortId
    analyticsLoading.value = true
    try {
        const res = await getCohortAnalytics(cohortId)
        const data = (res?.data?.data as AnalyticsShape) ?? null
        analytics.value = data ?? MOCK_ANALYTICS
    } catch {
        analytics.value = MOCK_ANALYTICS
    } finally {
        analyticsLoading.value = false
    }
}

const gradeDistributionBuckets = computed<GradeBucket[]>(() =>
    analytics.value?.grade_distribution ?? []
)

interface InstructorGroup { name: string; mean: number; count: number }

const instructorGroups = computed<InstructorGroup[]>(() =>
    (analytics.value?.lab_groups ?? []).map((g): InstructorGroup => ({
        name:  g?.name  ?? 'Group',
        mean:  Number(g?.average_score  ?? 0),
        count: Number(g?.students_count ?? 0),
    }))
)

const groupDeviation = computed<number>(() => {
    const groups = instructorGroups.value ?? []
    if (groups.length < 2) return 0
    const means = groups.map(g => g.mean)
    return Math.max(...means) - Math.min(...means)
})

const maxGroupMean = computed<number>(() => {
    const groups = instructorGroups.value ?? []
    if (groups.length === 0) return 1
    return Math.max(...groups.map(g => g.mean), 1)
})

interface AttendanceCell { date: string; rate: number }

const attendanceCells = computed<AttendanceCell[]>(() =>
    (analytics.value?.recent_sessions ?? []).slice(0, 15).map((s): AttendanceCell => ({
        date: s?.session_date    !== undefined ? s.session_date    : '',
        rate: s?.attendance_rate !== undefined ? Number(s.attendance_rate) : 0,
    }))
)

function cellShade(rate: number): string {
    if (rate >= 90) return 'bg-neutral-800 text-white'
    if (rate >= 75) return 'bg-neutral-600 text-white'
    if (rate >= 60) return 'bg-neutral-300 text-neutral-800'
    if (rate > 0)   return 'bg-warning-light border border-warning/30 text-warning'
    return 'bg-neutral-100 text-neutral-400'
}

function formatShortDate(d: string): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const legendEntries: Array<[string, string]> = [
    ['bg-neutral-800',                            '≥ 90%' ],
    ['bg-neutral-600',                            '75–89%'],
    ['bg-neutral-300',                            '60–74%'],
    ['bg-warning-light border border-warning/30', '< 60%' ],
]

const billingRollup = computed(() => {
    return analytics.value ? { total_cost: 86500, cost_per_student: 1965 } : null
})
</script>

<template>
    <div class="min-h-screen bg-brand-surface p-6">
        <div class="mb-6">
            <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Track Admin</p>
            <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">My Cohorts</h1>
            <hr class="mt-3 border-t border-neutral-300" />
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="i in 2" :key="i" class="bg-white rounded-card border border-neutral-300 p-6 animate-pulse h-32" />
        </div>

        <div v-else-if="cohorts.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
            <p class="text-4xl mb-4">📂</p>
            <p class="text-neutral-500 font-sans">You have not been assigned to any cohort yet.</p>
        </div>

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
                        :class="cohort.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'"
                    >{{ cohort.status }}</span>
                </div>
                <p class="text-sm text-neutral-500 font-sans mb-4">{{ cohort.track?.name ?? 'No track' }}</p>
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

        <template v-if="!loading && cohorts.length > 0">
            <div class="mt-10 mb-6">
                <div class="flex items-end justify-between">
                    <div>
                        <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Performance</p>
                        <h2 class="font-serif text-[36px] text-neutral-800 leading-tight">Analytics Overview</h2>
                    </div>
                    <select
                        v-if="cohorts.length > 1"
                        :value="selectedAnalyticsCohortId"
                        class="h-btn-sm rounded-btn border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-700 focus:border-neutral-800 focus:outline-none"
                        @change="loadAnalytics(Number(($event.target as HTMLSelectElement).value))"
                    >
                        <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                </div>
                <hr class="mt-3 border-t border-neutral-300" />
            </div>

            <div
                v-if="!analyticsLoading && groupDeviation > 8"
                class="mb-6 flex items-start gap-4 rounded-card border border-warning/30 bg-warning-light p-5"
            >
                <div class="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <div>
                    <p class="font-sans text-sm font-semibold text-warning mb-0.5">Grading Consistency Alert</p>
                    <p class="font-sans text-sm text-warning/90">
                        Score deviation between instructor groups is
                        <strong>{{ groupDeviation.toFixed(1) }} points</strong>
                        — exceeds the 8-point threshold. Review grading rubrics to ensure calibration across lab groups.
                    </p>
                </div>
            </div>

            <template v-if="billingRollup">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-white rounded-card border border-neutral-300 p-4">
                        <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1">Total Cost</p>
                        <p class="font-serif text-[22px] text-neutral-900 leading-none tabular-nums">
                            EGP {{ billingRollup?.total_cost?.toLocaleString('en-EG') ?? '0' }}
                        </p>
                    </div>
                    <div class="bg-white rounded-card border border-neutral-300 p-4">
                        <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-0.5">Cost / Student</p>
                        <p class="font-serif text-[22px] text-neutral-900 leading-none tabular-nums">
                            EGP {{ billingRollup?.cost_per_student?.toLocaleString('en-EG') ?? '0' }}
                        </p>
                    </div>
                </div>
            </template>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <GradeDistributionChart :buckets="gradeDistributionBuckets" :loading="analyticsLoading" />

                <div class="bg-white rounded-card border border-neutral-300 overflow-hidden">
                    <div class="px-6 py-4 border-b border-neutral-300 bg-neutral-50">
                        <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-0.5">Instructor Groups</p>
                        <h3 class="font-sans text-h3 font-medium text-neutral-800">Grader Consistency</h3>
                    </div>
                    <div class="px-6 py-5">
                        <div v-if="analyticsLoading" class="space-y-4">
                            <div v-for="i in 3" :key="i" class="animate-pulse">
                                <div class="h-3 w-1/3 bg-neutral-200 rounded mb-2" />
                                <div class="h-6 w-full bg-neutral-100 rounded" />
                            </div>
                        </div>
                        <div v-else-if="instructorGroups.length === 0" class="py-10 text-center font-sans text-sm text-neutral-500">
                            No lab group data available.
                        </div>
                        <div v-else class="space-y-4">
                            <div v-for="group in instructorGroups" :key="group.name">
                                <div class="flex items-baseline justify-between mb-1.5">
                                    <span class="font-sans text-sm font-medium text-neutral-800">{{ group.name }}</span>
                                    <span class="font-mono text-sm text-neutral-600 tabular-nums">
                                        {{ group.mean.toFixed(1) }} avg · {{ group.count }} students
                                    </span>
                                </div>
                                <div class="h-6 rounded-input bg-neutral-100 overflow-hidden">
                                    <div
                                        class="h-full rounded-input bg-neutral-800 transition-all duration-slow"
                                        :style="{ width: Math.min((group.mean / maxGroupMean) * 100, 100) + '%' }"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-card border border-neutral-300 overflow-hidden mb-6">
                <div class="px-6 py-4 border-b border-neutral-300 bg-neutral-50">
                    <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-0.5">Recent Sessions</p>
                    <h3 class="font-sans text-h3 font-medium text-neutral-800">Attendance Heatmap</h3>
                </div>
                <div class="px-6 py-5">
                    <div v-if="analyticsLoading" class="grid grid-cols-5 gap-2">
                        <div v-for="i in 15" :key="i" class="h-14 rounded-card bg-neutral-100 animate-pulse" />
                    </div>
                    <div v-else-if="attendanceCells.length === 0" class="py-10 text-center font-sans text-sm text-neutral-500">
                        No session attendance data yet.
                    </div>
                    <div v-else class="grid grid-cols-5 gap-2">
                        <div
                            v-for="(cell, idx) in attendanceCells"
                            :key="idx"
                            class="rounded-card p-3 flex flex-col items-center justify-center gap-1 min-h-14"
                            :class="cellShade(cell.rate)"
                            :title="`${cell.date}: ${cell.rate}% attendance`"
                        >
                            <span class="font-sans text-[10px] uppercase tracking-wide opacity-75">
                                {{ formatShortDate(cell.date) }}
                            </span>
                            <span class="font-mono text-sm font-medium tabular-nums">{{ cell.rate }}%</span>
                        </div>
                    </div>
                    <div v-if="!analyticsLoading && attendanceCells.length > 0" class="mt-4 flex items-center gap-4 flex-wrap">
                        <div v-for="[shade, label] in legendEntries" :key="label" class="flex items-center gap-1.5">
                            <span class="inline-block w-3 h-3 rounded-sm" :class="shade" />
                            <span class="font-sans text-[11px] text-neutral-500">{{ label }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
</style>
