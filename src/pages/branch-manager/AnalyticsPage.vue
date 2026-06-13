<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBranchAnalytics, getCohortAnalytics, getAtRiskStudents } from '@/api/modules/analytics.api'
import { RefreshCw, TrendingUp, Users, AlertTriangle, BarChart3, ChevronRight } from '@lucide/vue'

interface CohortRow {
  cohort_id: number
  cohort_name: string
  students_count: number
  at_risk_count: number
  average_grade: number
  attendance_percentage: number
}

interface AtRiskStudent {
  student_id: number
  name: string
  ledger_balance: number
  gpa: number
}

const isLoading = ref(false)
const cohortRows = ref<CohortRow[]>([])
const selectedCohortId = ref<number | null>(null)
const cohortDetail = ref<Record<string, unknown> | null>(null)
const atRiskStudents = ref<AtRiskStudent[]>([])
const isLoadingDetail = ref(false)
const errorMsg = ref<string | null>(null)

const fetchBranchAnalytics = async () => {
  isLoading.value = true
  errorMsg.value = null
  try {
    const res = await getBranchAnalytics()
    const data = (res.data.data ?? []) as Array<Record<string, Record<string, unknown>>>
    cohortRows.value = data.map(item => ({
      cohort_id: (item.meta?.cohort_id ?? item.cohort_id ?? 0) as number,
      cohort_name: (item.meta?.cohort_name ?? item.cohort_name ?? 'Cohort') as string,
      students_count: (item.meta?.students_count ?? item.students_count ?? 0) as number,
      at_risk_count: (item.meta?.at_risk_count ?? item.at_risk_count ?? 0) as number,
      average_grade: parseFloat(String(item.meta?.average_grade ?? item.average_grade ?? 0)),
      attendance_percentage: parseFloat(String(item.meta?.attendance_percentage ?? item.attendance_percentage ?? 0)),
    }))

    if (cohortRows.value.length > 0 && cohortRows.value[0]) {
      await selectCohort(cohortRows.value[0].cohort_id)
    }
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'Failed to load analytics'
  } finally {
    isLoading.value = false
  }
}

const selectCohort = async (cohortId: number) => {
  selectedCohortId.value = cohortId
  isLoadingDetail.value = true
  cohortDetail.value = null
  atRiskStudents.value = []
  try {
    const [detailRes, atRiskRes] = await Promise.allSettled([
      getCohortAnalytics(cohortId),
      getAtRiskStudents(cohortId)
    ])
    if (detailRes.status === 'fulfilled') cohortDetail.value = detailRes.value.data.data as Record<string, unknown>
    if (atRiskRes.status === 'fulfilled') {
      const d = atRiskRes.value.data.data as { at_risk_students?: AtRiskStudent[] }
      atRiskStudents.value = d?.at_risk_students ?? []
    }
  } finally {
    isLoadingDetail.value = false
  }
}

onMounted(fetchBranchAnalytics)
</script>

<template>
  <div class="min-h-screen p-6">
    <div class="mb-8">
      <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Branch Manager</p>
      <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">Analytics Overview</h1>
      <div class="h-[1px] bg-[#C9BDB8] w-full mt-4"></div>
    </div>

    <div v-if="isLoading" class="py-16 text-center">
      <RefreshCw class="w-8 h-8 text-[#940002] animate-spin mx-auto mb-3" />
      <p class="text-sm text-[#666]">Loading analytics...</p>
    </div>

    <div v-else-if="errorMsg" class="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{{ errorMsg }}</div>

    <template v-else>
      <!-- Summary Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
          <div class="flex items-center gap-3 mb-3">
            <BarChart3 class="w-5 h-5 text-[#940002]" />
            <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Active Cohorts</span>
          </div>
          <p class="font-serif text-[40px] text-[#1A0000]">{{ cohortRows.length }}</p>
        </div>
        <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
          <div class="flex items-center gap-3 mb-3">
            <Users class="w-5 h-5 text-[#940002]" />
            <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Total Students</span>
          </div>
          <p class="font-serif text-[40px] text-[#1A0000]">
            {{ cohortRows.reduce((s, c) => s + c.students_count, 0) }}
          </p>
        </div>
        <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
          <div class="flex items-center gap-3 mb-3">
            <AlertTriangle class="w-5 h-5 text-amber-500" />
            <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">At-Risk Total</span>
          </div>
          <p class="font-serif text-[40px] text-[#940002]">
            {{ cohortRows.reduce((s, c) => s + c.at_risk_count, 0) }}
          </p>
        </div>
      </div>

      <!-- Cohorts Table -->
      <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden mb-8">
        <div class="p-6 border-b border-[#C9BDB8]">
          <h2 class="font-serif text-[20px] text-[#1A0000]">Cohort Breakdown</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F5EDEA]">
                <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Cohort</th>
                <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-center">Students</th>
                <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-center">At-Risk</th>
                <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#C9BDB8]">
              <tr v-for="cohort in cohortRows" :key="cohort.cohort_id"
                class="hover:bg-[#F5EDEA] transition-colors cursor-pointer"
                :class="selectedCohortId === cohort.cohort_id ? 'bg-[#F5EDEA]' : ''"
                @click="selectCohort(cohort.cohort_id)"
              >
                <td class="p-4 font-sans text-sm font-semibold text-[#1A0000]">{{ cohort.cohort_name }}</td>
                <td class="p-4 text-center font-mono text-sm text-[#666]">{{ cohort.students_count }}</td>
                <td class="p-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="cohort.at_risk_count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                    {{ cohort.at_risk_count }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <ChevronRight class="w-4 h-4 text-[#940002] ml-auto" />
                </td>
              </tr>
              <tr v-if="cohortRows.length === 0">
                <td colspan="4" class="p-8 text-center text-sm text-[#888]">No cohort data available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Selected Cohort At-Risk Panel -->
      <div v-if="selectedCohortId" class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
        <div class="p-6 border-b border-[#C9BDB8] flex items-center gap-3">
          <TrendingUp class="w-5 h-5 text-[#940002]" />
          <h2 class="font-serif text-[20px] text-[#1A0000]">At-Risk Students</h2>
          <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-bold">{{ atRiskStudents.length }}</span>
        </div>
        <div v-if="isLoadingDetail" class="p-8 text-center">
          <RefreshCw class="w-6 h-6 text-[#940002] animate-spin mx-auto" />
        </div>
        <div v-else-if="atRiskStudents.length === 0" class="p-8 text-center text-sm text-[#888]">
          No at-risk students in this cohort. 🎉
        </div>
        <div v-else class="divide-y divide-[#C9BDB8]">
          <div v-for="student in atRiskStudents" :key="student.student_id" class="p-4 flex items-center justify-between">
            <div>
              <p class="font-semibold text-sm text-[#1A0000]">{{ student.name }}</p>
              <div class="flex gap-4 mt-1 text-xs text-[#666]">
                <span>Ledger: <b :class="student.ledger_balance < 150 ? 'text-red-600' : ''">{{ student.ledger_balance }}</b>/250</span>
                <span v-if="student.gpa < 60">GPA: <b class="text-red-600">{{ student.gpa }}</b></span>
              </div>
            </div>
            <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
