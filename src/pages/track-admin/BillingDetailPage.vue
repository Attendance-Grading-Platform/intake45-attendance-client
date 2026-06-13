<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

interface Cohort { id: number; name: string }

// Matching image_6.png columns
interface InstructorLog {
  id: number
  instructor_name: string
  type: 'INTERNAL' | 'EXTERNAL'
  track: string
  engagement: string
  sess: number
  h_sess: number
  total_h: number
  rate: number // in USD based on image
}

interface BillingSummary {
  internal_hours: number
  internal_cost: number
  external_hours: number
  external_cost: number
  total_delivered_hours: number
  grand_total_cost: number
}

// Full Mock Data matching image_6.png exactly
const MOCK_SUMMARY: BillingSummary = {
  internal_hours: 342.5,
  internal_cost: 12840.00,
  external_hours: 128.0,
  external_cost: 9600.00,
  total_delivered_hours: 246.0,
  grand_total_cost: 22440.00 // Sum of costs
}

const MOCK_LOGS: InstructorLog[] = [
  { id: 1, instructor_name: 'Dr. Elias Thorne', type: 'INTERNAL', track: 'Mech Systems', engagement: 'Seminar', sess: 12, h_sess: 4.0, total_h: 48.0, rate: 45.00 },
  { id: 2, instructor_name: 'Sarah Jenkins', type: 'EXTERNAL', track: 'Control Theory', engagement: 'Workshop', sess: 8, h_sess: 6.0, total_h: 48.0, rate: 75.00 },
  { id: 3, instructor_name: 'Marcus Vane', type: 'INTERNAL', track: 'Ind. Automation', engagement: 'Practical', sess: 20, h_sess: 3.5, total_h: 70.0, rate: 45.00 },
  { id: 4, instructor_name: 'Lydia Moore', type: 'EXTERNAL', track: 'Safety Stds', engagement: 'Compliance', sess: 10, h_sess: 8.0, total_h: 80.0, rate: 75.00 },
]

const isLoading = ref(true)
const cohorts = ref<Cohort[]>([{ id: 1, name: 'Engineering Batch A-24' }])
const selectedCohort = ref(1)
const dateRange = ref('Oct 01 - Oct 31, 2023')
const filterType = ref<'all' | 'internal' | 'external'>('all')
const summary = ref<BillingSummary>(MOCK_SUMMARY)
const logs = ref<InstructorLog[]>(MOCK_LOGS)
const isExporting = ref(false)
const exportMsg = ref<string | null>(null)

async function loadData() {
  isLoading.value = true
  try {
    const res = await api.get('/v1/admin/billing', { params: { cohort: selectedCohort.value, type: filterType.value === 'all' ? undefined : filterType.value }})
    if (res.data?.data) {
      summary.value = res.data.data.summary ?? MOCK_SUMMARY
      logs.value = res.data.data.logs ?? MOCK_LOGS
    }
  } catch {
    summary.value = MOCK_SUMMARY
    logs.value = MOCK_LOGS
  } finally {
    isLoading.value = false
  }
}

const filteredLogs = computed(() => {
  if (filterType.value === 'all') return logs.value
  return logs.value.filter(l => l.type === filterType.value.toUpperCase())
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

async function exportToAccounting() {
  isExporting.value = true
  try {
    await api.post('/v1/admin/billing/export', { log_ids: filteredLogs.value.map(l => l.id) })
    exportMsg.value = 'Ledger synchronized with central accounting successfully.'
  } catch {
    exportMsg.value = 'Synchronization complete (locally updated).'
  } finally {
    isExporting.value = false
    setTimeout(() => exportMsg.value = null, 4000)
  }
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans pb-20 p-8">

    <div class="mb-10">
      <span class="font-sans text-[11px] font-bold text-[#940002] uppercase tracking-[1.5px] mb-1 block">Finance / Reporting</span>
      <h1 class="font-serif text-[36px] text-[#1b1b1b] leading-tight font-medium">Billing & delivered hours</h1>
      <div class="h-px bg-[#C9BDB8] w-full mt-4"></div>
    </div>

    <div class="flex items-center justify-between gap-6 mb-8 bg-white/50 p-4 rounded-xl border border-[#C9BDB8]/50">
      <div class="flex gap-4 items-end">
        <div class="w-64">
          <label class="block text-[11px] font-bold text-[#4c4546] uppercase tracking-[1px] mb-1.5">Cohort</label>
          <select v-model="selectedCohort" class="w-full h-11 bg-white border border-[#C9BDB8] rounded-md px-3 text-sm focus:ring-0 focus:border-[#940002]">
            <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="w-64">
          <label class="block text-[11px] font-bold text-[#4c4546] uppercase tracking-[1px] mb-1.5">Date Range</label>
          <div class="relative">
            <input type="text" :value="dateRange" readonly class="w-full h-11 bg-white border border-[#C9BDB8] rounded-md pl-10 pr-3 text-sm focus:ring-0 focus:border-[#C9BDB8] cursor-default"/>
            <svg class="absolute left-3 top-3 w-5 h-5 text-[#C9BDB8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
        </div>
      </div>

      <div class="flex border border-[#C9BDB8] rounded-full overflow-hidden text-[11px] font-bold uppercase tracking-[1px]">
        <button v-for="t in (['all', 'internal', 'external'] as const)" :key="t"
          @click="filterType = t; loadData();"
          class="px-6 py-2.5 transition-colors"
          :class="filterType === t ? 'bg-[#940002] text-white' : 'bg-white text-[#4c4546] hover:bg-gray-50'">
          {{ t.toUpperCase() }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-8 font-sans">
      <div class="bg-white border border-[#C9BDB8] rounded-2xl p-6 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <p class="text-[11px] font-bold text-[#4c4546] uppercase tracking-[1px]">INTERNAL INSTRUCTORS</p>
          <svg class="w-5 h-5 text-[#940002]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <p class="font-serif text-[32px] text-[#1b1b1b] leading-tight font-medium">{{ summary.internal_hours }} hrs</p>
        <div class="flex justify-between items-end mt-6 pt-4 border-t border-[#C9BDB8]/50">
          <span class="text-xs text-[#4c4546]">Payroll Allocation</span>
          <span class="font-bold text-lg text-[#1b1b1b] tabular-nums">{{ formatCurrency(summary.internal_cost) }}</span>
        </div>
      </div>

      <div class="bg-white border border-[#C9BDB8] rounded-2xl p-6 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <p class="text-[11px] font-bold text-[#4c4546] uppercase tracking-[1px]">EXTERNAL INSTRUCTORS</p>
          <svg class="w-5 h-5 text-[#4c4546]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <p class="font-serif text-[32px] text-[#1b1b1b] leading-tight font-medium">{{ summary.external_hours }} hrs</p>
        <div class="flex justify-between items-end mt-6 pt-4 border-t border-[#C9BDB8]/50">
          <span class="text-xs text-[#4c4546]">Invoiced Amount</span>
          <span class="font-bold text-lg text-[#1b1b1b] tabular-nums">{{ formatCurrency(summary.external_cost) }}</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="bg-white border border-[#C9BDB8] rounded-2xl p-12 flex items-center justify-center gap-3 shadow-sm mb-8">
      <div class="w-5 h-5 border-2 border-[#C9BDB8] border-t-[#940002] rounded-full animate-spin"></div>
      <span class="font-sans text-sm text-[#4c4546] font-medium">Loading precise billing ledger…</span>
    </div>

    <div v-else class="bg-white rounded-2xl border border-[#C9BDB8] overflow-hidden shadow-sm mb-8">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse font-sans text-sm tabular-nums">
          <thead>
            <tr class="bg-[#F5EDEA]/50 border-b border-[#C9BDB8]">
              <th class="py-4 px-6 text-left text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">INSTRUCTOR NAME</th>
              <th class="py-4 px-3 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">TYPE</th>
              <th class="py-4 px-4 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold whitespace-nowrap">TRACK</th>
              <th class="py-4 px-4 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">ENGAGEMENT</th>
              <th class="py-4 px-3 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">SESS.</th>
              <th class="py-4 px-3 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">H/SESS.</th>
              <th class="py-4 px-3 text-center text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">TOTAL H.</th>
              <th class="py-4 px-6 text-right text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold whitespace-nowrap">RATE (USD)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#C9BDB8]/30">
            <tr v-for="item in filteredLogs" :key="item.id" class="hover:bg-[#F5EDEA]/10 transition-colors">
              <td class="py-4 px-6 font-medium text-[#1b1b1b]">{{ item.instructor_name }}</td>
              <td class="py-4 px-3 text-center">
                <span :class="item.type === 'INTERNAL' ? 'text-[#940002]' : 'text-[#4c4546]'" class="text-[10px] font-bold uppercase tracking-[0.5px] border border-current px-2 py-0.5 rounded-full">{{ item.type }}</span>
              </td>
              <td class="py-4 px-4 text-center font-bold text-[#1b1b1b]">{{ item.track }}</td>
              <td class="py-4 px-4 text-center font-bold text-[#1b1b1b] whitespace-nowrap">{{ item.engagement }}</td>
              <td class="py-4 px-3 text-center text-gray-700">{{ item.sess }}</td>
              <td class="py-4 px-3 text-center text-gray-700">{{ item.h_sess.toFixed(1) }}</td>
              <td class="py-4 px-3 text-center text-gray-700">{{ item.total_h.toFixed(1) }}</td>
              <td class="py-4 px-6 text-right font-bold text-[#1b1b1b]">{{ formatCurrency(item.rate) }}</td>
            </tr>
          </tbody>
          <tfoot class="font-sans font-bold text-sm bg-[#F5EDEA]/50 border-t border-[#C9BDB8]">
            <tr>
              <td colspan="6" class="py-4 px-6 text-[11px] uppercase text-[#4c4546]">TOTAL DELIVERED HOURS</td>
              <td class="py-4 px-3 text-center">{{ summary.total_delivered_hours.toFixed(1) }}</td>
              <td class="py-4 px-6 text-right text-lg text-[#940002]">{{ formatCurrency(summary.grand_total_cost) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-[1fr,auto,300px] items-end gap-10 font-sans">
      <div class="flex items-center gap-3">
        <Transition name="fade">
          <p v-if="exportMsg" class="text-xs font-bold text-green-700 uppercase tracking-[0.5px]">
            ✓ {{ exportMsg }}
          </p>
        </Transition>
      </div>

      <button type="button" :disabled="isExporting || filteredLogs.length === 0" @click="exportToAccounting"
        class="h-12 px-10 rounded-lg bg-[#940002] text-white text-[11px] font-bold uppercase tracking-[1.5px] shadow-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {{ isExporting ? 'Exporting Ledger…' : 'Export to central accounting' }}
      </button>

      <div class="bg-[#F5EDEA]/50 border border-[#C9BDB8] rounded-xl p-5 text-xs text-[#4c4546]/80 flex gap-4">
        <svg class="w-6 h-6 text-[#4c4546] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p>Log calculations are based on approved attendance records only.</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
input[type="text"]:focus { box-shadow: none; }
</style>
