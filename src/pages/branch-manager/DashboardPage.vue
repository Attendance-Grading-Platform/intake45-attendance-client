<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'
import { useBranchDashboard } from '@/composables/useBranchDashboard'
import MetricBarCell from '@/components/analytics/MetricBarCell.vue'
import { formatCurrency } from '@/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const cohortStore = useCohortStore()

const {
    loading,
    error,
    branchSummary,
    activeTracksCount,
    pendingBillingHours,
    trackPerformance,
    atRiskStudents,
    billingRows,
    billingTotals,
    fetchDashboard,
    exportBillingCsv,
} = useBranchDashboard()

const greeting = computed(() => {
    const hour = new Date().getHours()
    const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return `${salutation}, ${authStore.user?.name ?? 'Manager'}`
})

function attendanceColor(rate: number): string {
    if (rate >= 85) return 'text-[#2D6A4F]'
    if (rate >= 70) return 'text-[#92400E]'
    return 'text-[#991B1B]'
}

function openStudentProfile(studentId: number, studentName: string, cohortName: string): void {
    cohortStore.openStudentProfile(studentId, studentName, cohortName, '—')
}

onMounted(() => fetchDashboard())
</script>

<template>
    <div class="max-w-7xl mx-auto pb-10">
        <header class="mb-8">
            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-2">
                Branch overview
            </p>
            <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">
                {{ greeting }}
            </h1>
            <hr class="border-[#C9BDB8] mt-4" />
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
                <div v-for="n in 4" :key="n" class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-24" />
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div class="lg:col-span-3 bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-72" />
                <div class="lg:col-span-2 bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-72" />
            </div>
            <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-64" />
        </div>

        <template v-else-if="!error">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                    <p class="font-sans text-[32px] font-medium text-[#1A0000] tabular-nums leading-none">
                        {{ activeTracksCount }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Active tracks</p>
                </div>
                <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                    <p class="font-sans text-[32px] font-medium text-[#1A0000] tabular-nums leading-none">
                        {{ branchSummary.totalStudents }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Enrolled students</p>
                </div>
                <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                    <p
                        class="font-sans text-[32px] font-medium tabular-nums leading-none text-[#92400E]"
                    >
                        {{ branchSummary.totalAtRisk }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">At-risk students</p>
                </div>
                <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                    <p class="font-sans text-[32px] font-medium text-[#1A0000] tabular-nums leading-none">
                        {{ pendingBillingHours.toFixed(1) }}
                    </p>
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Pending billing hours</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <section class="lg:col-span-3 bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                    <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Track performance</p>
                    <h2 class="font-serif text-[26px] text-[#1A0000] mb-6">Pass rate by track</h2>

                    <div v-if="trackPerformance.length === 0" class="py-10 text-center text-[#888888] text-sm">
                        No track data available yet.
                    </div>
                    <div v-else class="space-y-5">
                        <div
                            v-for="track in trackPerformance"
                            :key="track.trackName"
                            class="space-y-2"
                        >
                            <div class="flex items-center justify-between gap-4">
                                <span class="font-sans text-[14px] text-[#1A0000]">{{ track.trackName }}</span>
                                <span class="font-sans text-[13px] tabular-nums" :class="attendanceColor(track.passRate)">
                                    {{ track.passRate }}% pass
                                </span>
                            </div>
                            <div class="h-[8px] bg-[#E6DDD4] rounded-full overflow-hidden">
                                <div
                                    class="h-full bg-[#940002]/80 rounded-full transition-all"
                                    :style="{ width: `${Math.min(track.passRate, 100)}%` }"
                                />
                            </div>
                            <div class="flex items-center gap-2 text-[12px] text-[#888888]">
                                <span>Attendance</span>
                                <MetricBarCell :value="track.attendanceRate" suffix="%" />
                            </div>
                        </div>
                    </div>
                </section>

                <section class="lg:col-span-2 bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden">
                    <div class="px-6 py-5 border-b border-[#C9BDB8]">
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Students at risk</p>
                        <h2 class="font-serif text-[22px] text-[#1A0000]">Needs attention</h2>
                    </div>

                    <div v-if="atRiskStudents.length === 0" class="px-6 py-12 text-center text-[#2D6A4F] text-sm">
                        No at-risk students across active cohorts.
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full font-sans border-collapse">
                            <thead>
                                <tr class="border-b border-[#E6DDD4]">
                                    <th class="px-6 py-3 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px]">Student</th>
                                    <th class="px-6 py-3 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px]">Cohort</th>
                                    <th class="px-6 py-3 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px]">GPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="student in atRiskStudents.slice(0, 8)"
                                    :key="student.student_id"
                                    class="border-b border-[#F0EBE6] last:border-b-0 hover:bg-[#FAFAFA] cursor-pointer"
                                    @click="openStudentProfile(student.student_id, student.name, student.cohort_name)"
                                >
                                    <td class="px-6 py-3.5">
                                        <div class="flex items-center gap-2">
                                            <span class="w-2 h-2 rounded-full bg-[#D97706]" />
                                            <span class="text-[14px] text-[#1A0000]">{{ student.name }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-3.5 text-[13px] text-[#666666]">{{ student.cohort_name }}</td>
                                    <td class="px-6 py-3.5 text-right text-[14px] tabular-nums" :class="student.gpa < 60 ? 'text-[#991B1B]' : 'text-[#1A0000]'">
                                        {{ student.gpa }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-if="atRiskStudents.length > 8" class="px-6 py-3 border-t border-[#E6DDD4]">
                        <button
                            type="button"
                            class="text-[13px] text-[#8B1A1A] hover:underline"
                            @click="router.push({ name: 'branch-manager-analytics' })"
                        >
                            View all {{ atRiskStudents.length }} students →
                        </button>
                    </div>
                </section>
            </div>

            <section class="bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden">
                <div class="px-6 py-5 border-b border-[#C9BDB8] flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Billing rollup</p>
                        <h2 class="font-serif text-[26px] text-[#1A0000]">Instructor compensation</h2>
                    </div>
                    <button
                        type="button"
                        class="h-[38px] px-4 rounded-[6px] border border-[#C9BDB8] font-sans text-[13px] text-[#1A0000] hover:bg-[#F5EDEA] transition-colors disabled:opacity-50"
                        :disabled="billingRows.length === 0"
                        @click="exportBillingCsv"
                    >
                        Export to Accounting
                    </button>
                </div>

                <div v-if="billingRows.length === 0" class="px-6 py-12 text-center text-[#888888] text-sm">
                    No billing snapshots generated yet.
                    <button
                        type="button"
                        class="block mx-auto mt-3 text-[#8B1A1A] hover:underline"
                        @click="router.push({ name: 'branch-manager-billing' })"
                    >
                        Open billing dashboard
                    </button>
                </div>
                <div v-else class="overflow-x-auto">
                    <table class="w-full min-w-[720px] font-sans border-collapse">
                        <thead>
                            <tr class="border-b border-[#C9BDB8] bg-[#F5EDEA]/60">
                                <th class="px-6 py-3 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px]">Instructor</th>
                                <th class="px-6 py-3 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px]">Type</th>
                                <th class="px-6 py-3 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px]">Cohort</th>
                                <th class="px-6 py-3 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px]">Hours</th>
                                <th class="px-6 py-3 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in billingRows"
                                :key="row.id"
                                class="border-b border-[#E6DDD4] last:border-b-0"
                            >
                                <td class="px-6 py-4 text-[14px] text-[#1A0000]">{{ row.name }}</td>
                                <td class="px-6 py-4">
                                    <span
                                        v-if="row.compensation_type === 'internal'"
                                        class="inline-flex px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#940002] text-[#E6DDD4]"
                                    >
                                        Internal
                                    </span>
                                    <span
                                        v-else
                                        class="inline-flex px-2 py-0.5 rounded-[4px] text-[11px] font-medium border border-[#940002] text-[#940002]"
                                    >
                                        External
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-[13px] text-[#666666]">{{ row.cohort_name }}</td>
                                <td class="px-6 py-4 text-right text-[14px] tabular-nums text-[#666666]">
                                    {{ row.delivered_hours.toFixed(1) }}h
                                </td>
                                <td class="px-6 py-4 text-right text-[14px] font-semibold tabular-nums text-[#1A0000]">
                                    {{ formatCurrency(row.total_amount) }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="bg-[#F5EDEA]/40 border-t border-[#C9BDB8]">
                                <td colspan="3" class="px-6 py-4 font-sans text-[14px] font-semibold text-[#1A0000]">
                                    Grand total
                                </td>
                                <td class="px-6 py-4 text-right font-semibold tabular-nums text-[#1A0000]">
                                    {{ (billingTotals.internalHours + billingTotals.externalHours).toFixed(1) }}h
                                </td>
                                <td class="px-6 py-4 text-right font-semibold tabular-nums text-[#1A0000]">
                                    {{ formatCurrency(billingTotals.grandTotal) }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </template>
    </div>
</template>
