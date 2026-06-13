<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCohortStore } from '@/stores/cohort.store'
import { useBranchAnalytics, atRiskReasons } from '@/composables/useBranchAnalytics'
import PageHeader from '@/components/shared/PageHeader.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import MetricBarCell from '@/components/analytics/MetricBarCell.vue'
import StudentNameCell from '@/components/analytics/StudentNameCell.vue'
import AnalyticsStatusCell from '@/components/analytics/AnalyticsStatusCell.vue'
import type { CohortAnalytics } from '@/types/analytics.types'

const router = useRouter()
const cohortStore = useCohortStore()

const {
    selectedCohortId,
    trackFilter,
    showAtRiskOnly,
    loading,
    error,
    branchSummary,
    trackNames,
    filteredCohorts,
    selectedCohort,
    drillDownStudents,
    cohortSelectOptions,
    atRiskCount,
    fetchBranchAnalytics,
    selectCohort,
} = useBranchAnalytics()

function attendanceColor(rate: number): string {
    if (rate >= 85) return 'text-[#2D6A4F]'
    if (rate >= 70) return 'text-[#92400E]'
    return 'text-[#991B1B]'
}

function passRateColor(rate: number): string {
    if (rate >= 80) return 'text-[#2D6A4F]'
    if (rate >= 60) return 'text-[#92400E]'
    return 'text-[#991B1B]'
}

function studentInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
}

const cohortTableCount = computed(() => filteredCohorts.value.length)

function goToCohortDetail(cohort: CohortAnalytics): void {
    router.push({
        name: 'branch-manager-cohort-detail',
        params: { cohortId: cohort.meta.cohort_id },
    })
}

function openStudentProfile(studentId: number, studentName: string): void {
    const cohortName = selectedCohort.value?.meta.cohort_name ?? 'Cohort'
    cohortStore.openStudentProfile(studentId, studentName, cohortName, '—')
}

function onCohortSelect(value: string | number): void {
    selectCohort(Number(value))
}

onMounted(() => fetchBranchAnalytics())
</script>

<template>
    <div class="max-w-7xl mx-auto pb-10">
        <PageHeader label="Branch analytics" title="Performance overview" />

        <p class="font-sans text-[14px] text-[#666666] leading-relaxed -mt-4 mb-8">
            Branch-wide attendance and grade rollups with drill-down into any cohort.
            Students are flagged at-risk when attendance falls below 85% or GPA drops below 60.
        </p>

        <!-- Error -->
        <div
            v-if="error && !loading"
            class="mb-6 p-4 rounded-[10px] border border-[#991B1B] bg-[#FEE2E2] text-[#991B1B] font-sans text-[14px] flex flex-wrap items-center justify-between gap-3"
        >
            <span>{{ error }}</span>
            <button
                type="button"
                class="h-[34px] px-3 text-[13px] font-medium border border-[#991B1B] rounded-[6px] hover:bg-white transition-colors"
                @click="fetchBranchAnalytics"
            >
                Retry
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div v-for="n in 4" :key="n" class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-24" />
            </div>
            <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-72" />
        </div>

        <template v-else-if="!error">
            <!-- Empty -->
            <div
                v-if="cohortSelectOptions.length === 0"
                class="bg-white rounded-[10px] border border-[#C9BDB8] p-12 text-center"
            >
                <p class="font-serif text-[26px] text-[#1A0000] mb-2">No analytics yet</p>
                <p class="font-sans text-[14px] text-[#666666]">
                    Create cohorts and enroll students to see branch performance data.
                </p>
            </div>

            <template v-else>
                <!-- Summary metrics -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                        <p class="font-sans text-[32px] font-medium text-[#1A0000] tabular-nums leading-none">
                            {{ branchSummary.totalStudents }}
                        </p>
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Total students</p>
                    </div>
                    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                        <p class="font-sans text-[32px] font-medium tabular-nums leading-none" :class="attendanceColor(branchSummary.avgAttendance)">
                            {{ branchSummary.avgAttendance }}%
                        </p>
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Avg attendance</p>
                    </div>
                    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                        <p class="font-sans text-[32px] font-medium tabular-nums leading-none" :class="passRateColor(branchSummary.avgPassRate)">
                            {{ branchSummary.avgPassRate }}%
                        </p>
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">Avg pass rate</p>
                    </div>
                    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
                        <p
                            class="font-sans text-[32px] font-medium tabular-nums leading-none"
                            :class="branchSummary.totalAtRisk > 0 ? 'text-[#92400E]' : 'text-[#2D6A4F]'"
                        >
                            {{ branchSummary.totalAtRisk }}
                        </p>
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-2">At-risk students</p>
                    </div>
                </div>

                <!-- Cohort performance table -->
                <section class="mb-8 bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden">
                    <div class="px-6 py-5 border-b border-[#C9BDB8] flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">
                                Cohort comparison
                            </p>
                            <h2 class="font-serif text-[26px] text-[#1A0000] leading-tight">
                                Performance by cohort
                            </h2>
                        </div>
                        <div class="flex flex-wrap items-end gap-4">
                            <span class="font-sans text-[13px] text-[#888888] tabular-nums pb-2">
                                {{ cohortTableCount }} {{ cohortTableCount === 1 ? 'cohort' : 'cohorts' }}
                            </span>
                            <div v-if="trackNames.length > 1" class="w-44">
                                <SelectInput
                                    v-model="trackFilter"
                                    label="Track"
                                    :options="[
                                        { label: 'All tracks', value: 'all' },
                                        ...trackNames.map((name) => ({ label: name, value: name })),
                                    ]"
                                />
                            </div>
                        </div>
                    </div>

                    <div v-if="filteredCohorts.length === 0" class="px-6 py-14 text-center">
                        <p class="font-sans text-[14px] text-[#888888]">No cohorts match this track filter.</p>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="w-full min-w-[880px] font-sans border-collapse">
                            <colgroup>
                                <col class="w-[22%]">
                                <col class="w-[16%]">
                                <col class="w-[8%]">
                                <col class="w-[16%]">
                                <col class="w-[16%]">
                                <col class="w-[10%]">
                                <col class="w-[12%]">
                            </colgroup>
                            <thead>
                                <tr class="border-b border-[#C9BDB8] bg-[#F5EDEA]/60">
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Cohort
                                    </th>
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Track
                                    </th>
                                    <th class="px-6 py-3 text-right text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Students
                                    </th>
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Attendance
                                    </th>
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Pass rate
                                    </th>
                                    <th class="px-6 py-3 text-center text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        At-risk
                                    </th>
                                    <th class="px-6 py-3 text-right text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="cohort in filteredCohorts"
                                    :key="cohort.meta.cohort_id"
                                    class="border-b border-[#C9BDB8] last:border-b-0 transition-colors hover:bg-[#F5EDEA]"
                                    :class="selectedCohortId === cohort.meta.cohort_id ? 'bg-[#F5EDEA] border-l-2 border-l-[#940002]' : ''"
                                >
                                    <td class="px-6 py-4 align-middle">
                                        <p class="text-[14px] font-medium text-[#1A0000]">
                                            {{ cohort.meta.cohort_name }}
                                        </p>
                                        <p class="text-[12px] text-[#888888] mt-0.5 tabular-nums">
                                            {{ cohort.meta.total_sessions }} sessions
                                        </p>
                                    </td>
                                    <td class="px-6 py-4 align-middle text-[14px] text-[#666666]">
                                        {{ cohort.track_name ?? '—' }}
                                    </td>
                                    <td class="px-6 py-4 align-middle text-right">
                                        <span class="text-[14px] font-medium text-[#1A0000] tabular-nums">
                                            {{ cohort.meta.student_count }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 align-middle">
                                        <MetricBarCell
                                            :value="cohort.averages.attendance_rate"
                                            :color-class="attendanceColor(cohort.averages.attendance_rate)"
                                        />
                                    </td>
                                    <td class="px-6 py-4 align-middle">
                                        <MetricBarCell
                                            :value="cohort.averages.pass_rate"
                                            :color-class="passRateColor(cohort.averages.pass_rate)"
                                        />
                                    </td>
                                    <td class="px-6 py-4 align-middle text-center">
                                        <span
                                            class="inline-flex min-w-[32px] justify-center items-center px-2.5 py-1 rounded-[6px] text-[11px] font-medium tracking-wide uppercase border tabular-nums"
                                            :class="atRiskCount(cohort) > 0
                                                ? 'bg-[#FEF3C7] text-[#92400E] border-[#92400E]'
                                                : 'bg-[#D1FAE5] text-[#2D6A4F] border-[#2D6A4F]'"
                                        >
                                            {{ atRiskCount(cohort) }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 align-middle">
                                        <div class="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                class="h-[30px] px-3 text-[12px] font-medium rounded-[6px] border border-[#940002] text-[#940002] hover:bg-[#F5EDEA] transition-colors whitespace-nowrap"
                                                @click="selectCohort(cohort.meta.cohort_id)"
                                            >
                                                Drill down
                                            </button>
                                            <button
                                                type="button"
                                                class="h-[30px] px-3 text-[12px] font-medium rounded-[6px] text-[#666666] hover:text-[#1A0000] hover:bg-[#F5EDEA] transition-colors whitespace-nowrap"
                                                @click="goToCohortDetail(cohort)"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Student drill-down table -->
                <section v-if="selectedCohort" class="bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden">
                    <div class="px-6 py-5 border-b border-[#C9BDB8]">
                        <div class="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">
                                    Cohort drill-down
                                </p>
                                <h2 class="font-serif text-[26px] text-[#1A0000] leading-tight">
                                    {{ selectedCohort.meta.cohort_name }}
                                </h2>
                                <p class="font-sans text-[14px] text-[#666666] mt-1">
                                    {{ selectedCohort.track_name }}
                                    <span class="text-[#C9BDB8] mx-2">·</span>
                                    {{ selectedCohort.meta.student_count }} students
                                    <span class="text-[#C9BDB8] mx-2">·</span>
                                    {{ selectedCohort.meta.total_sessions }} sessions
                                </p>
                            </div>
                            <div class="flex flex-wrap items-end gap-4">
                                <div class="w-52">
                                    <SelectInput
                                        :model-value="String(selectedCohortId ?? '')"
                                        label="Switch cohort"
                                        :options="cohortSelectOptions.map((o) => ({ label: o.label, value: String(o.value) }))"
                                        @update:model-value="onCohortSelect"
                                    />
                                </div>
                                <label class="flex items-center gap-2 h-[40px] font-sans text-[14px] text-[#666666] cursor-pointer select-none">
                                    <input
                                        v-model="showAtRiskOnly"
                                        type="checkbox"
                                        class="rounded border-[#C9BDB8] text-[#940002] focus:ring-0 focus:outline-none"
                                    />
                                    At-risk only
                                </label>
                            </div>
                        </div>
                    </div>

                    <div v-if="drillDownStudents.length === 0" class="px-6 py-14 text-center">
                        <p class="font-sans text-[14px] text-[#888888]">
                            {{ showAtRiskOnly ? 'No at-risk students in this cohort.' : 'No students enrolled yet.' }}
                        </p>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="w-full min-w-[720px] font-sans border-collapse">
                            <colgroup>
                                <col class="w-[34%]">
                                <col class="w-[18%]">
                                <col class="w-[12%]">
                                <col class="w-[24%]">
                                <col class="w-[12%]">
                            </colgroup>
                            <thead>
                                <tr class="border-b border-[#C9BDB8] bg-[#F5EDEA]/60">
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Student
                                    </th>
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Attendance
                                    </th>
                                    <th class="px-6 py-3 text-right text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        GPA
                                    </th>
                                    <th class="px-6 py-3 text-left text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-right text-[11px] font-normal text-[#888888] tracking-[1.5px] uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="student in drillDownStudents"
                                    :key="student.student_id"
                                    class="border-b border-[#C9BDB8] last:border-b-0 transition-colors hover:bg-[#F5EDEA]"
                                    :class="student.is_at_risk ? 'bg-[#FEF3C7]/20' : ''"
                                >
                                    <td class="px-6 py-4 align-middle">
                                        <StudentNameCell
                                            :label="student.name"
                                            :initials="studentInitials(student.name)"
                                        />
                                    </td>
                                    <td class="px-6 py-4 align-middle">
                                        <MetricBarCell
                                            :value="student.attendance_rate"
                                            :color-class="attendanceColor(student.attendance_rate)"
                                        />
                                    </td>
                                    <td class="px-6 py-4 align-middle text-right">
                                        <span
                                            class="text-[15px] font-medium tabular-nums"
                                            :class="passRateColor(student.gpa)"
                                        >
                                            {{ student.gpa }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 align-middle">
                                        <AnalyticsStatusCell
                                            :status="student.is_at_risk ? 'at_risk' : 'on_track'"
                                            :reasons="student.is_at_risk ? atRiskReasons(student) : undefined"
                                        />
                                    </td>
                                    <td class="px-6 py-4 align-middle text-right">
                                        <button
                                            type="button"
                                            class="h-[30px] px-3 text-[12px] font-medium rounded-[6px] border border-[#940002] text-[#940002] hover:bg-[#F5EDEA] transition-colors whitespace-nowrap"
                                            @click="openStudentProfile(student.student_id, student.name)"
                                        >
                                            View profile
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Table footer summary -->
                    <div
                        v-if="drillDownStudents.length > 0"
                        class="px-6 py-3 border-t border-[#C9BDB8] bg-[#F5EDEA]/30 flex flex-wrap items-center justify-between gap-2"
                    >
                        <p class="font-sans text-[12px] text-[#888888] tracking-wide uppercase">
                            Showing {{ drillDownStudents.length }} students
                        </p>
                        <p class="font-sans text-[13px] text-[#666666] tabular-nums">
                            {{ drillDownStudents.filter((s) => s.is_at_risk).length }} at-risk
                            ·
                            {{ drillDownStudents.filter((s) => !s.is_at_risk).length }} on track
                        </p>
                    </div>
                </section>
            </template>
        </template>
    </div>
</template>
