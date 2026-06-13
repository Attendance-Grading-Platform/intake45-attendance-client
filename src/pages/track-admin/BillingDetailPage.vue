<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useBilling } from '@/composables/useBilling'
import { formatCurrency } from '@/utils/format'
import {
  CreditCard,
  Users,
  Briefcase,
  Calculator,
  RefreshCw,
  ChevronRight,
  Info
} from '@lucide/vue'
import type { BillingEntry } from '@/types/billing.types'
import { ref } from 'vue'

const {
  cohorts,
  selectedCohort,
  rollup,
  loadingCohorts,
  loadingRollup,
  generating,
  fetchCohorts,
  fetchRollup,
  generateRollup,
  internalEntries,
  externalEntries,
  internalTotal,
  externalTotal,
} = useBilling()

onMounted(() => {
  fetchCohorts()
})

watch(selectedCohort, (newId) => {
  if (newId) fetchRollup(newId)
})

const handleGenerate = () => {
  if (selectedCohort.value) generateRollup(selectedCohort.value)
}

const selectedInstructor = ref<BillingEntry | null>(null)
const isDrawerOpen = ref(false)
const openInstructorDetail = (instructor: BillingEntry) => {
  selectedInstructor.value = instructor
  isDrawerOpen.value = true
}
</script>

<template>
  <div class="min-h-screen pb-12 p-6">
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Track Admin — Finance</p>
          <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">Billing Overview</h1>
          <p class="font-sans text-sm text-[#666666] mt-1">Instructor compensation for your cohort</p>
        </div>
        <div class="w-full md:w-[320px]">
          <label class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1.5 block">Select Cohort</label>
          <div class="relative">
            <select
              v-model="selectedCohort"
              class="w-full h-[40px] rounded-[6px] border border-[#C9BDB8] font-sans text-sm text-[#1A0000] px-3 bg-white focus:border-[#940002] focus:outline-none appearance-none disabled:opacity-50"
              :disabled="loadingCohorts"
            >
              <option :value="null" disabled>Select a cohort</option>
              <option v-for="cohort in cohorts" :key="cohort.id" :value="cohort.id">
                {{ cohort.name }} ({{ cohort.status === 'active' ? 'Active' : 'Closed' }})
              </option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight class="w-4 h-4 text-[#888888] rotate-90" />
            </div>
          </div>
        </div>
      </div>
      <div class="h-[1px] bg-[#C9BDB8] w-full mt-6"></div>
    </div>

    <div v-if="!selectedCohort" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-[#C9BDB8] mb-4">
        <Users class="w-10 h-10 text-[#C9BDB8]" />
      </div>
      <h2 class="font-serif text-[24px] text-[#1A0000] mb-2">No Cohort Selected</h2>
      <p class="font-sans text-[#666666] max-w-sm">Select a cohort from the dropdown to view billing information.</p>
    </div>

    <template v-else>
      <div v-if="!rollup && !loadingRollup" class="max-w-2xl mx-auto mt-12">
        <div class="bg-[#FEF3C7]/30 border border-[#92400E]/20 rounded-[10px] p-8 text-center">
          <div class="w-16 h-16 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator class="w-8 h-8 text-[#92400E]" />
          </div>
          <h3 class="font-serif text-[22px] text-[#1A0000] mb-3">Billing not generated yet</h3>
          <p class="font-sans text-[#666666] mb-8">No billing rollup has been generated for this cohort.</p>
          <button
            @click="handleGenerate"
            :disabled="generating"
            class="px-8 h-[44px] bg-[#940002] text-[#E6DDD4] rounded-[6px] font-sans font-medium flex items-center justify-center mx-auto hover:bg-[#7a0002] transition-colors disabled:opacity-50"
          >
            <RefreshCw v-if="generating" class="w-4 h-4 mr-2 animate-spin" />
            {{ generating ? 'Calculating...' : 'Generate Billing Rollup' }}
          </button>
        </div>
      </div>

      <div v-else-if="loadingRollup" class="py-24 text-center">
        <RefreshCw class="w-8 h-8 text-[#940002] animate-spin mx-auto mb-4" />
        <p class="font-sans text-[#666666]">Fetching billing data...</p>
      </div>

      <div v-else-if="rollup" class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Total Cost</span>
              <CreditCard class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">{{ formatCurrency(rollup.total_cost) }}</p>
            <p class="font-sans text-[13px] text-[#666666]">for {{ rollup.cohort_name }}</p>
          </div>
          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Internal Hours</span>
              <Users class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">{{ rollup.total_internal_hours }} hrs</p>
            <p class="font-sans text-[13px] text-[#666666]">Track Admin teaching</p>
          </div>
          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">External Hours</span>
              <Briefcase class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">{{ rollup.total_external_hours }} hrs</p>
            <p class="font-sans text-[13px] text-[#666666]">Freelance instructors</p>
          </div>
        </div>

        <!-- Tables -->
        <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
          <div class="p-6 border-b border-[#C9BDB8] flex items-center gap-3">
            <h3 class="font-serif text-[20px] text-[#1A0000]">Internal Instructors</h3>
            <span class="px-2 py-0.5 bg-[#940002] text-[#E6DDD4] rounded-[4px] text-[11px] font-medium">{{ internalEntries.length }}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F5EDEA]">
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Name</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Salary</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-center">Hrs</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Rate</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#C9BDB8]">
                <tr v-for="entry in internalEntries" :key="entry.user_id" class="hover:bg-[#F5EDEA] transition-colors cursor-pointer group" @click="openInstructorDetail(entry)">
                  <td class="p-4 font-sans text-sm text-[#1A0000]">
                    <div class="flex items-center gap-2">{{ entry.name }}<ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#940002]" /></div>
                  </td>
                  <td class="p-4 font-sans text-sm text-[#666666]">{{ formatCurrency(entry.fixed_salary) }}</td>
                  <td class="p-4 font-sans text-sm text-[#666666] text-center">{{ entry.delivered_hours }}h</td>
                  <td class="p-4 font-sans text-sm text-[#666666]">{{ entry.hourly_rate }} EGP/h</td>
                  <td class="p-4 font-sans text-sm font-semibold text-[#1A0000] text-right">{{ formatCurrency(entry.total_amount) }}</td>
                </tr>
                <tr v-if="internalEntries.length === 0"><td colspan="5" class="p-8 text-center font-sans text-sm text-[#888888]">No internal instructors</td></tr>
              </tbody>
              <tfoot v-if="internalEntries.length > 0">
                <tr class="bg-[#F5EDEA]/50">
                  <td colspan="4" class="p-4 font-sans text-xs text-[#888888] tracking-[1px] uppercase">Internal Subtotal</td>
                  <td class="p-4 font-sans text-sm text-[#940002] text-right">{{ formatCurrency(internalTotal) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
          <div class="p-6 border-b border-[#C9BDB8] flex items-center gap-3">
            <h3 class="font-serif text-[20px] text-[#1A0000]">External Instructors</h3>
            <span class="px-2 py-0.5 border border-[#C9BDB8] text-[#666666] rounded-[4px] text-[11px] font-medium">{{ externalEntries.length }}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F5EDEA]">
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Name</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-center">Hours</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Hourly Rate</th>
                  <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#C9BDB8]">
                <tr v-for="entry in externalEntries" :key="entry.user_id" class="hover:bg-[#F5EDEA] transition-colors cursor-pointer group" @click="openInstructorDetail(entry)">
                  <td class="p-4 font-sans text-sm text-[#1A0000]">
                    <div class="flex items-center gap-2">{{ entry.name }}<ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#940002]" /></div>
                  </td>
                  <td class="p-4 font-sans text-sm text-[#666666] text-center">{{ entry.delivered_hours }} hrs</td>
                  <td class="p-4 font-sans text-sm text-[#666666]">{{ entry.hourly_rate }} EGP/h</td>
                  <td class="p-4 font-sans text-sm font-semibold text-[#1A0000] text-right">{{ formatCurrency(entry.total_amount) }}</td>
                </tr>
                <tr v-if="externalEntries.length === 0"><td colspan="4" class="p-8 text-center font-sans text-sm text-[#888888]">No external instructors</td></tr>
              </tbody>
              <tfoot v-if="externalEntries.length > 0">
                <tr class="bg-[#F5EDEA]/50">
                  <td colspan="3" class="p-4 font-sans text-xs text-[#888888] tracking-[1px] uppercase">External Subtotal</td>
                  <td class="p-4 font-sans text-sm text-[#940002] text-right">{{ formatCurrency(externalTotal) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Grand Total -->
        <div class="bg-[#1A0000] text-[#E6DDD4] rounded-[10px] p-8">
          <div class="flex flex-col md:flex-row justify-between gap-6 items-center">
            <div class="flex items-center gap-6">
              <div>
                <p class="text-[11px] text-white/50 tracking-[1.5px] uppercase mb-1">Internal</p>
                <p class="text-[18px] font-medium">{{ formatCurrency(internalTotal) }}</p>
              </div>
              <div class="w-[1px] h-10 bg-white/10"></div>
              <div>
                <p class="text-[11px] text-white/50 tracking-[1.5px] uppercase mb-1">External</p>
                <p class="text-[18px] font-medium">{{ formatCurrency(externalTotal) }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[11px] text-[#940002] bg-[#E6DDD4] px-2 py-0.5 rounded-[4px] inline-block tracking-[1.5px] uppercase mb-2 font-semibold">Grand Total</p>
              <p class="text-[32px] font-serif">{{ formatCurrency(rollup.total_cost) }}</p>
            </div>
          </div>
          <div class="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-white/40">
            <Info class="w-4 h-4" />
            <span class="text-xs italic">Generated: {{ new Date(rollup.generated_at).toLocaleDateString() }}</span>
            <button @click="handleGenerate" :disabled="generating" class="ml-auto flex items-center gap-2 text-[11px] text-white/60 hover:text-white transition-colors border border-white/20 px-3 py-1.5 rounded">
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': generating }" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Instructor Detail Drawer -->
    <div v-if="isDrawerOpen" class="fixed inset-0 bg-[#111111]/30 backdrop-blur-sm z-50 flex justify-end" @click="isDrawerOpen = false">
      <div class="w-full max-w-[440px] h-full bg-[#E6DDD4] shadow-2xl flex flex-col" @click.stop>
        <div class="bg-white p-8 border-b border-[#C9BDB8]">
          <div class="flex justify-between items-center mb-4">
            <button @click="isDrawerOpen = false" class="text-[#888888] hover:text-[#1A0000]">
              <ChevronRight class="w-6 h-6 rotate-180" />
            </button>
            <div class="px-3 py-1 bg-[#F5EDEA] text-[#666666] rounded-[4px] text-[11px] font-bold uppercase tracking-widest">Instructor</div>
          </div>
          <h2 class="font-serif text-[28px] text-[#1A0000]">{{ selectedInstructor?.name }}</h2>
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider mt-2 inline-block"
            :class="selectedInstructor?.compensation_type === 'internal' ? 'bg-[#940002] text-[#E6DDD4]' : 'border border-[#C9BDB8] text-[#666666]'">
            {{ selectedInstructor?.compensation_type }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto p-8 space-y-6">
          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-5 space-y-3">
            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Compensation Breakdown</p>
            <div v-if="selectedInstructor?.compensation_type === 'internal'" class="space-y-2 text-sm text-[#666666]">
              <div class="flex justify-between"><span>Fixed Salary</span><span class="font-semibold text-[#1A0000]">{{ formatCurrency(selectedInstructor.fixed_salary) }}</span></div>
              <div class="flex justify-between"><span>Delivered Hours</span><span>{{ selectedInstructor.delivered_hours }} hrs × {{ selectedInstructor.hourly_rate }} EGP/h</span></div>
              <div class="flex justify-between"><span>Hourly Component</span><span>{{ formatCurrency(selectedInstructor.hourly_component) }}</span></div>
              <div class="flex justify-between border-t border-[#C9BDB8] pt-2 font-semibold text-[#1A0000]"><span>Total</span><span>{{ formatCurrency(selectedInstructor.total_amount) }}</span></div>
            </div>
            <div v-else class="space-y-2 text-sm text-[#666666]">
              <div class="flex justify-between"><span>Delivered Hours</span><span>{{ selectedInstructor?.delivered_hours }} hrs</span></div>
              <div class="flex justify-between"><span>Hourly Rate</span><span>{{ selectedInstructor?.hourly_rate }} EGP/h</span></div>
              <div class="flex justify-between border-t border-[#C9BDB8] pt-2 font-semibold text-[#1A0000]"><span>Total</span><span>{{ formatCurrency(selectedInstructor?.total_amount ?? 0) }}</span></div>
            </div>
          </div>
        </div>
        <div class="p-6 bg-white border-t border-[#C9BDB8]">
          <button @click="isDrawerOpen = false" class="w-full h-[40px] bg-[#940002] text-[#E6DDD4] rounded-[6px] font-sans font-medium hover:bg-[#7a0002] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
