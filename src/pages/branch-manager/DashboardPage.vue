<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCohortStore } from '@/stores/cohort.store';
import { useAtRisk } from '@/composables/useAtRisk';
import { getBranchAnalytics } from '@/api/modules/analytics.api';
import { billingApi } from '@/api/modules/billing.api';
import type { BillingRollup } from '@/types/billing.types';

const cohortStore = useCohortStore();
const { cohorts, selectedCohortId, atRiskStudents, isLoading: isAtRiskLoading, fetchCohortsAndInitialAtRisk, selectCohort } = useAtRisk();

onMounted(async () => {
  await fetchCohortsAndInitialAtRisk();
  
  await cohortStore.fetchCohorts();
  const firstCohort = cohortStore.cohorts[0];
  if (firstCohort) {
    await cohortStore.fetchCohortStudents(firstCohort.id);
  }
});

const activeCohortName = computed(() => {
  return cohortStore.cohorts[0]?.name ?? 'No Active Cohorts';
});

// ── Branch-level metrics and billing (layered additions) ──

const MOCK_BRANCH_METRICS = {
  active_tracks: 3,
  total_enrolled: 87,
  at_risk_count: 5,
  pending_billing_count: 2,
  cohorts: [
    { cohort_id: 1, cohort_name: 'Intake 46 — Full-Stack',     students_count: 45 },
    { cohort_id: 2, cohort_name: 'Intake 46 — Data Science',   students_count: 28 },
    { cohort_id: 3, cohort_name: 'Intake 46 — Cybersecurity',  students_count: 14 },
  ],
}

const MOCK_BILLING_ROLLUP: BillingRollup = {
  id: 1,
  cohort_id: 1,
  cohort_name: 'Intake 46 — Full-Stack',
  generated_at: new Date().toISOString(),
  total_internal_hours: 120,
  total_external_hours: 48,
  total_cost: 14400,
  cost_per_student: 320,
  students_count: 45,
  entries: [
    { id: 1, user_id: 11, name: 'Ahmed Essam',   compensation_type: 'internal', delivered_hours: 60, hourly_rate: 80,  fixed_salary: 0, hourly_component: 4800, total_amount: 4800 },
    { id: 2, user_id: 12, name: 'Sara Khalil',   compensation_type: 'internal', delivered_hours: 60, hourly_rate: 80,  fixed_salary: 0, hourly_component: 4800, total_amount: 4800 },
    { id: 3, user_id: 13, name: 'Mahmoud Fathy', compensation_type: 'external', delivered_hours: 28, hourly_rate: 120, fixed_salary: 0, hourly_component: 3360, total_amount: 3360 },
    { id: 4, user_id: 14, name: 'Malak Essam',   compensation_type: 'external', delivered_hours: 20, hourly_rate: 72,  fixed_salary: 0, hourly_component: 1440, total_amount: 1440 },
  ],
}

interface BranchMetrics {
  active_tracks: number
  total_enrolled: number
  at_risk_count: number
  pending_billing_count: number
  cohorts: { cohort_name: string; students_count: number; cohort_id: number }[]
}

const metricsLoading = ref(false)
const metrics = ref<BranchMetrics | null>(null)

const billingLoading = ref(false)
const billingRollup = ref<BillingRollup | null>(null)
const billingCohortId = ref<number | null>(null)

async function loadBranchMetrics() {
  metricsLoading.value = true
  try {
    const res = await getBranchAnalytics()
    interface AnalyticsItem {
      meta?: { cohort_id?: number; cohort_name?: string; active_tracks?: number; students_count?: number; at_risk_count?: number; billing_generated?: boolean }
      cohort_id?: number
      cohort_name?: string
    }
    const data = (res.data.data ?? []) as AnalyticsItem[]
    if (data.length === 0) {
      metrics.value = MOCK_BRANCH_METRICS
      billingCohortId.value = MOCK_BRANCH_METRICS.cohorts[0]!.cohort_id
      loadBilling(MOCK_BRANCH_METRICS.cohorts[0]!.cohort_id)
      return
    }
    const firstCohortId = data[0]?.meta?.cohort_id ?? data[0]?.cohort_id ?? null
    metrics.value = {
      active_tracks: data.reduce((acc, d) => acc + (d.meta?.active_tracks ?? 1), 0),
      total_enrolled: data.reduce((acc, d) => acc + (d.meta?.students_count ?? 0), 0),
      at_risk_count: data.reduce((acc, d) => acc + (d.meta?.at_risk_count ?? 0), 0),
      pending_billing_count: data.filter((d) => !d.meta?.billing_generated).length,
      cohorts: data.map((d) => ({
        cohort_id: d.meta?.cohort_id ?? d.cohort_id ?? 0,
        cohort_name: d.meta?.cohort_name ?? d.cohort_name ?? 'Cohort',
        students_count: d.meta?.students_count ?? 0,
      })),
    }
    if (firstCohortId) {
      billingCohortId.value = firstCohortId
      loadBilling(firstCohortId)
    }
  } catch {
    metrics.value = MOCK_BRANCH_METRICS
    billingCohortId.value = MOCK_BRANCH_METRICS.cohorts[0]?.cohort_id ?? 0
    loadBilling(MOCK_BRANCH_METRICS.cohorts[0]?.cohort_id ?? 0)
  } finally {
    metricsLoading.value = false
  }
}

async function loadBilling(cohortId: number) {
  billingCohortId.value = cohortId
  billingLoading.value = true
  billingRollup.value = null
  try {
    const res = await billingApi.getRollup(cohortId)
    const data: BillingRollup | null = res.data.data ?? null
    billingRollup.value = data ?? MOCK_BILLING_ROLLUP
  } catch {
    billingRollup.value = MOCK_BILLING_ROLLUP
  } finally {
    billingLoading.value = false
  }
}

const maxEnrolled = computed(() => {
  if (!metrics.value?.cohorts.length) return 1
  return Math.max(...metrics.value.cohorts.map(c => c.students_count), 1)
})

const statCards = computed(() => [
  { label: 'Active Tracks',    value: metrics.value?.active_tracks ?? '—',           icon: '🛤️' },
  { label: 'Total Enrolled',   value: metrics.value?.total_enrolled ?? '—',           icon: '🎓' },
  { label: 'At-Risk Students', value: metrics.value?.at_risk_count ?? '—',            icon: '⚠️' },
  { label: 'Pending Billing',  value: metrics.value?.pending_billing_count ?? '—',    icon: '💳' },
])

function exportBillingCsv() {
  if (!billingRollup.value) return
  const rows = [
    ['Instructor', 'Type', 'Delivered Hours', 'Hourly Rate', 'Total Amount'],
    ...billingRollup.value.entries.map(e => [
      e.name,
      e.compensation_type,
      e.delivered_hours,
      e.hourly_rate,
      e.total_amount,
    ]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `billing-${billingRollup.value.cohort_name.replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => { loadBranchMetrics() })
</script>

<template>
  <div class="bg-[#FFFFFF] p-6 rounded-[10px] border border-[#E0D4B8]">

      <div class="mb-6">
        <h3 class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
          Branch Manager View
        </h3>
        <h1 class="font-serif text-[26px] text-[#000000] leading-none mb-4">
          Dashboard
        </h1>
        <hr class="border-t border-[#E0D4B8]" />
      </div>

      <!-- Metrics Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="bg-white rounded-card border border-[#E0D4B8] p-5 flex flex-col gap-2"
        >
          <div class="flex items-center justify-between">
            <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px]">{{ stat.label }}</p>
            <span class="text-lg">{{ stat.icon }}</span>
          </div>
          <p class="font-serif text-[32px] text-[#000000] leading-none tabular-nums">
            <span v-if="metricsLoading" class="block h-8 w-12 bg-neutral-200 rounded animate-pulse" />
            <template v-else>{{ stat.value }}</template>
          </p>
        </div>
      </div>

      <!-- Enrollment Horizontal Bar Chart -->
      <div v-if="metrics && metrics.cohorts.length > 0" class="mb-8 bg-white rounded-card border border-[#E0D4B8] overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E0D4B8]">
          <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-0.5">Overview</p>
          <h3 class="font-sans text-[18px] font-medium text-[#000000]">Enrollment by Cohort</h3>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div v-for="cohort in metrics.cohorts" :key="cohort.cohort_id" class="flex items-center gap-3">
            <span class="w-32 font-sans text-[12px] text-[#666666] truncate shrink-0">{{ cohort.cohort_name }}</span>
            <div class="flex-1 h-7 bg-neutral-100 rounded-input overflow-hidden">
              <div
                class="h-full bg-[#000000] rounded-input transition-all duration-slow"
                :style="{ width: Math.min((cohort.students_count / maxEnrolled) * 100, 100) + '%' }"
              />
            </div>
            <span class="w-8 font-mono text-[12px] text-[#666666] tabular-nums text-right shrink-0">
              {{ cohort.students_count }}
            </span>
          </div>
        </div>
      </div>

      <!-- At Risk Students Card -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-serif text-xl text-neutral-900">At-Risk Students</h2>
          <div v-if="cohorts.length > 0">
            <select 
              v-model="selectedCohortId" 
              @change="selectCohort(selectedCohortId as number)"
              class="text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option v-for="cohort in cohorts" :key="cohort.cohort_id" :value="cohort.cohort_id">
                {{ cohort.cohort_name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="isAtRiskLoading" class="text-sm text-slate-500 py-4">
          Loading at-risk students...
        </div>
        <div v-else-if="atRiskStudents.length === 0" class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center text-emerald-700">
          <p class="font-medium">No at-risk students in this cohort.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div 
            v-for="student in (atRiskStudents as any[])" 
            :key="student.student_id" 
            class="bg-white border border-rose-200 shadow-sm rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 rounded-full bg-warning"></span>
                <span class="font-semibold text-slate-800">{{ student.name }}</span>
              </div>
              <div class="text-xs text-slate-500 flex gap-4">
                <span>Ledger: <span class="font-bold" :class="student.ledger_balance < 150 ? 'text-rose-600' : ''">{{ student.ledger_balance }}</span>/250</span>
                <span v-if="student.gpa < 60">GPA: <span class="font-bold text-rose-600">{{ student.gpa }}</span></span>
              </div>
            </div>
            <button 
              @click="cohortStore.openStudentProfile(student.student_id, student.name, 'At-Risk View', 'General')"
              class="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
            >
              View
            </button>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <h2 class="font-serif text-xl text-[#000000]">
          {{ activeCohortName }} Full Roster
        </h2>
      </div>

      <div v-if="cohortStore.isLoading" class="text-[14px] text-[#888888] py-4 text-center">
        Loading students...
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#E0D4B8]">
              <th class="py-3 px-4 font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider">Student Name</th>
              <th class="py-3 px-4 font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider">Email</th>
              <th class="py-3 px-4 font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="student in (cohortStore.students as any[])" 
              :key="student.id"
              class="border-b border-[#E0D4B8] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
            >
              <td class="py-4 px-4 font-sans text-[14px] text-[#000000]">{{ student.name }}</td>
              <td class="py-4 px-4 font-sans text-[14px] text-[#666666]">{{ student.email }}</td>
              <td class="py-4 px-4 text-right">
                <button 
                  @click="cohortStore.openStudentProfile(student.id, student.name, activeCohortName, 'General')"
                  class="h-8 px-4 rounded-md bg-[#000000] text-[#FFFFFF] font-sans text-[12px] hover:bg-[#111111] transition-colors"
                >
                  View Profile
                </button>
              </td>
            </tr>
            <tr v-if="!cohortStore.students.length">
              <td colspan="3" class="py-6 text-center text-[14px] text-[#888888]">No students found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Billing Rollup Table -->
      <div class="mt-10">
        <div class="mb-4 flex items-end justify-between">
          <div>
            <h3 class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</h3>
            <h2 class="font-serif text-[26px] text-[#000000] leading-none">Billing Rollup</h2>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-if="metrics && metrics.cohorts.length > 1"
              :value="billingCohortId"
              class="h-btn-sm rounded-btn border border-[#E0D4B8] bg-white px-3 font-sans text-sm text-[#666666] focus:border-[#000000] focus:outline-none"
              @change="loadBilling(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="c in metrics!.cohorts" :key="c.cohort_id" :value="c.cohort_id">
                {{ c.cohort_name }}
              </option>
            </select>
            <button
              v-if="billingRollup"
              class="h-btn-sm px-4 rounded-btn border border-[#000000] bg-white font-sans text-[12px] text-[#000000] hover:bg-[#000000] hover:text-white transition-colors flex items-center gap-2"
              @click="exportBillingCsv"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>
        <hr class="border-t border-[#E0D4B8] mb-6" />

        <div v-if="billingLoading" class="py-8 text-center font-sans text-sm text-[#888888] animate-pulse">
          Loading billing data...
        </div>

        <div v-else-if="!billingRollup" class="py-8 text-center font-sans text-sm text-[#888888]">
          No billing rollup generated for this cohort yet.
        </div>

        <template v-else>
          <!-- Summary strip -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-card border border-[#E0D4B8] p-4">
              <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Total Cost</p>
              <p class="font-serif text-[24px] text-[#000000] leading-none tabular-nums">
                {{ billingRollup.total_cost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) }}
              </p>
            </div>
            <div class="bg-white rounded-card border border-[#E0D4B8] p-4">
              <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Cost / Student</p>
              <p class="font-serif text-[24px] text-[#000000] leading-none tabular-nums">
                {{ billingRollup.cost_per_student.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) }}
              </p>
            </div>
            <div class="bg-white rounded-card border border-[#E0D4B8] p-4">
              <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Internal Hours</p>
              <p class="font-serif text-[24px] text-[#000000] leading-none tabular-nums">{{ billingRollup.total_internal_hours }}h</p>
            </div>
            <div class="bg-white rounded-card border border-[#E0D4B8] p-4">
              <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">External Hours</p>
              <p class="font-serif text-[24px] text-[#000000] leading-none tabular-nums">{{ billingRollup.total_external_hours }}h</p>
            </div>
          </div>

          <!-- Entries table -->
          <div class="overflow-x-auto rounded-card border border-[#E0D4B8]">
            <table class="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr class="bg-neutral-50 border-b border-[#E0D4B8]">
                  <th class="py-3 px-5 text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">Instructor</th>
                  <th class="py-3 px-5 text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">Type</th>
                  <th class="py-3 px-5 text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal text-right">Hours</th>
                  <th class="py-3 px-5 text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal text-right">Rate</th>
                  <th class="py-3 px-5 text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E0D4B8]">
                <tr
                  v-for="entry in billingRollup.entries"
                  :key="entry.id"
                  class="hover:bg-neutral-50 transition-colors"
                >
                  <td class="py-4 px-5 font-medium text-[#000000]">{{ entry.name }}</td>
                  <td class="py-4 px-5">
                    <span
                      class="px-2 py-0.5 rounded-badge text-[10px] uppercase tracking-wider font-medium"
                      :class="entry.compensation_type === 'internal' ? 'bg-neutral-200 text-neutral-700' : 'bg-info-light text-info'"
                    >
                      {{ entry.compensation_type }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-right font-mono text-[#666666] tabular-nums">{{ entry.delivered_hours }}h</td>
                  <td class="py-4 px-5 text-right font-mono text-[#666666] tabular-nums">
                    {{ entry.hourly_rate > 0 ? '$' + entry.hourly_rate + '/hr' : '—' }}
                  </td>
                  <td class="py-4 px-5 text-right font-mono font-medium text-[#000000] tabular-nums">
                    ${{ entry.total_amount.toLocaleString() }}
                  </td>
                </tr>
                <tr v-if="billingRollup.entries.length === 0">
                  <td colspan="5" class="py-8 text-center text-[#888888]">No billing entries found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

    </div>
</template>
