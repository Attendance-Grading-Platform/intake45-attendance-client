<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useBilling } from '@/composables/useBilling'
import { formatCurrency } from '@/utils/format'
import BillingChart from '@/components/charts/BillingChart.vue'
import {
  CreditCard,
  Users,
  Briefcase,
  GraduationCap,
  Calculator,
  Clock,
  RefreshCw,
  ChevronRight,
  Info
} from '@lucide/vue'
import type { BillingEntry } from '@/types/billing.types'

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
  chartData
} = useBilling()

onMounted(() => {
  fetchCohorts()
})

watch(selectedCohort, (newId) => {
  if (newId) {
    fetchRollup(newId)
  }
})

const handleGenerate = () => {
  if (selectedCohort.value) {
    generateRollup(selectedCohort.value)
  }
}

// Instructor Details State
import { ref } from 'vue'
const selectedInstructor = ref<BillingEntry | null>(null)
const isDrawerOpen = ref(false)

const openInstructorDetail = (instructor: BillingEntry) => {
  selectedInstructor.value = instructor
  isDrawerOpen.value = true
}
</script>

<template>
  <div class="min-h-screen pb-12">
    <!-- Section 1: Page Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">
            Finance & Billing
          </p>
          <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">
            Billing Dashboard
          </h1>
          <p class="font-sans text-sm text-[#666666] mt-1">
            Financial overview of instructor compensation per cohort
          </p>
        </div>

        <div class="w-full md:w-[320px]">
          <label class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1.5 block">
            Select Cohort
          </label>
          <div class="relative">
            <select
              v-model="selectedCohort"
              class="w-full h-[40px] rounded-[6px] border border-[#C9BDB8] font-sans text-sm text-[#1A0000] px-3 bg-white focus:border-[#940002] focus:outline-none appearance-none disabled:opacity-50"
              :disabled="loadingCohorts"
            >
              <option :value="null" disabled>Select a cohort to view billing</option>
              <option
                v-for="cohort in cohorts"
                :key="cohort.id"
                :value="cohort.id"
              >
                {{ cohort.name }} — {{ cohort.track.name }} 
                ({{ cohort.status === 'active' ? 'Active' : 'Closed' }})
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

    <!-- Section 2: No Cohort Selected -->
    <div v-if="!selectedCohort" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-[#C9BDB8] mb-4">
        <Users class="w-10 h-10 text-[#C9BDB8]" />
      </div>
      <h2 class="font-serif text-[24px] text-[#1A0000] mb-2">No Cohort Selected</h2>
      <p class="font-sans text-[#666666] max-w-sm">
        Select a cohort from the dropdown above to view or generate billing information.
      </p>
    </div>

    <!-- Section 3: Rollup Not Generated -->
    <template v-else>
      <div v-if="!rollup && !loadingRollup" class="max-w-2xl mx-auto mt-12">
        <div class="bg-[#FEF3C7]/30 border border-[#92400E]/20 rounded-[10px] p-8 text-center">
          <div class="w-16 h-16 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator class="w-8 h-8 text-[#92400E]" />
          </div>
          <h3 class="font-serif text-[22px] text-[#1A0000] mb-3">Billing not generated yet</h3>
          <p class="font-sans text-[#666666] mb-8 leading-relaxed">
            No billing rollup has been generated for this cohort. 
            Calculating billing will process all delivered sessions and instructor hourly rates.
          </p>
          <button
            @click="handleGenerate"
            :disabled="generating"
            class="px-8 h-[44px] bg-[#940002] text-[#E6DDD4] rounded-[6px] font-sans font-medium flex items-center justify-center mx-auto hover:bg-[#7a0002] transition-colors disabled:opacity-50"
          >
            <RefreshCw v-if="generating" class="w-4 h-4 mr-2 animate-spin" />
            {{ generating ? 'Calculating...' : 'Generate Billing Rollup' }}
          </button>
          <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mt-6">
            Last generated: Never
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loadingRollup" class="py-24 text-center">
        <RefreshCw class="w-8 h-8 text-[#940002] animate-spin mx-auto mb-4" />
        <p class="font-sans text-[#666666]">Fetching billing data...</p>
      </div>

      <!-- Section 4: Data Explorer -->
      <div v-else-if="rollup" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Total Cost</span>
              <CreditCard class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">
              {{ formatCurrency(rollup.total_cost) }}
            </p>
            <p class="font-sans text-[13px] text-[#666666]">for {{ rollup.cohort_name }}</p>
          </div>

          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Internal Hours</span>
              <Users class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">
              {{ rollup.total_internal_hours }} hrs
            </p>
            <p class="font-sans text-[13px] text-[#666666]">Track Admin teaching</p>
          </div>

          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">External Hours</span>
              <Briefcase class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">
              {{ rollup.total_external_hours }} hrs
            </p>
            <p class="font-sans text-[13px] text-[#666666]">Freelance instructors</p>
          </div>

          <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase">Cost / Student</span>
              <GraduationCap class="w-5 h-5 text-[#940002]" />
            </div>
            <p class="font-sans text-[32px] font-medium text-[#1A0000] mb-1">
              {{ formatCurrency(rollup.cost_per_student) }}
            </p>
            <p class="font-sans text-[13px] text-[#666666]">across {{ rollup.students_count }} students</p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Column: Tables -->
          <div class="lg:col-span-8 space-y-8">
            
            <!-- Internal Table -->
            <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
              <div class="p-6 border-b border-[#C9BDB8] flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h3 class="font-serif text-[20px] text-[#1A0000]">Internal Instructors</h3>
                  <span class="px-2 py-0.5 bg-[#940002] text-[#E6DDD4] rounded-[4px] text-[11px] font-medium">
                    {{ internalEntries.length }}
                  </span>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-[#F5EDEA]">
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Name</th>
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Salary</th>
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-center">Hrs</th>
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">Rate</th>
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8]">H. Cost</th>
                      <th class="p-4 font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase border-b border-[#C9BDB8] text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#C9BDB8]">
                    <tr 
                      v-for="entry in internalEntries" 
                      :key="entry.name"
                      class="hover:bg-[#F5EDEA] transition-colors cursor-pointer group"
                      @click="openInstructorDetail(entry)"
                    >
                      <td class="p-4 font-sans text-sm text-[#1A0000]">
                        <div class="flex items-center gap-2">
                          {{ entry.name }}
                          <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#940002]" />
                        </div>
                      </td>
                      <td class="p-4 font-sans text-sm text-[#666666]">{{ formatCurrency(entry.fixed_salary) }}</td>
                      <td class="p-4 font-sans text-sm text-[#666666] text-center">{{ entry.delivered_hours }}h</td>
                      <td class="p-4 font-sans text-sm text-[#666666]">{{ entry.hourly_rate }} EGP/h</td>
                      <td class="p-4 font-sans text-sm text-[#666666]">{{ formatCurrency(entry.hourly_component) }}</td>
                      <td class="p-4 font-sans text-sm font-semibold text-[#1A0000] text-right">
                        {{ formatCurrency(entry.total_amount) }}
                      </td>
                    </tr>
                    <tr v-if="internalEntries.length === 0">
                      <td colspan="6" class="p-8 text-center font-sans text-sm text-[#888888]">
                        No internal instructors for this cohort
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="internalEntries.length > 0">
                    <tr class="bg-[#F5EDEA]/50 font-semibold">
                      <td colspan="5" class="p-4 font-sans text-xs text-[#888888] tracking-[1px] uppercase">Internal Subtotal</td>
                      <td class="p-4 font-sans text-sm text-[#940002] text-right">{{ formatCurrency(internalTotal) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- External Table -->
            <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
              <div class="p-6 border-b border-[#C9BDB8] flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h3 class="font-serif text-[20px] text-[#1A0000]">External Instructors</h3>
                  <span class="px-2 py-0.5 border border-[#C9BDB8] text-[#666666] rounded-[4px] text-[11px] font-medium">
                    {{ externalEntries.length }}
                  </span>
                </div>
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
                    <tr 
                      v-for="entry in externalEntries" 
                      :key="entry.name"
                      class="hover:bg-[#F5EDEA] transition-colors cursor-pointer group"
                      @click="openInstructorDetail(entry)"
                    >
                      <td class="p-4 font-sans text-sm text-[#1A0000]">
                        <div class="flex items-center gap-2">
                          {{ entry.name }}
                          <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#940002]" />
                        </div>
                      </td>
                      <td class="p-4 font-sans text-sm text-[#666666] text-center">{{ entry.delivered_hours }} hrs</td>
                      <td class="p-4 font-sans text-sm text-[#666666]">{{ entry.hourly_rate }} EGP/h</td>
                      <td class="p-4 font-sans text-sm font-semibold text-[#1A0000] text-right">
                        {{ formatCurrency(entry.total_amount) }}
                      </td>
                    </tr>
                    <tr v-if="externalEntries.length === 0">
                      <td colspan="4" class="p-8 text-center font-sans text-sm text-[#888888]">
                        No external instructors for this cohort
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="externalEntries.length > 0">
                    <tr class="bg-[#F5EDEA]/50 font-semibold">
                      <td colspan="3" class="p-4 font-sans text-xs text-[#888888] tracking-[1px] uppercase">External Subtotal</td>
                      <td class="p-4 font-sans text-sm text-[#940002] text-right">{{ formatCurrency(externalTotal) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Grand Total Section -->
            <div class="bg-[#1A0000] text-[#E6DDD4] rounded-[10px] p-8 shadow-xl">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-white/10">
                <div>
                  <p class="text-[11px] text-white/50 tracking-[1.5px] uppercase mb-2">Total Internal</p>
                  <p class="text-[20px] font-sans font-medium">{{ formatCurrency(internalTotal) }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-white/50 tracking-[1.5px] uppercase mb-2">Total External</p>
                  <p class="text-[20px] font-sans font-medium">{{ formatCurrency(externalTotal) }}</p>
                </div>
                <div class="md:text-right">
                  <p class="text-[11px] text-[#940002] bg-[#E6DDD4] px-2 py-0.5 rounded-[4px] inline-block tracking-[1.5px] uppercase mb-2 font-semibold">Grand Total</p>
                  <p class="text-[32px] font-serif leading-none">{{ formatCurrency(rollup.total_cost) }}</p>
                </div>
              </div>
              <div class="flex flex-col md:flex-row justify-between gap-4 text-white/70 font-sans text-sm">
                <div class="flex items-center gap-6">
                  <span>Enrolled Students: <b class="text-white ml-1">{{ rollup.students_count }}</b></span>
                  <div class="w-[1px] h-4 bg-white/20"></div>
                  <span>Cost per Student: <b class="text-white ml-1">{{ formatCurrency(rollup.cost_per_student) }}</b></span>
                </div>
                <div class="flex items-center gap-2 text-white/40">
                  <Info class="w-4 h-4" />
                  <span class="text-xs italic">Final calculation based on all sessions until {{ new Date(rollup.generated_at).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Chart & Meta -->
          <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            <!-- Chart Card -->
            <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 text-center">
              <h3 class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-8 text-left">Cost Distribution</h3>
              <div class="mb-8">
                <BillingChart 
                  :data="chartData" 
                  :total-amount="formatCurrency(rollup.total_cost)"
                />
              </div>
              
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-[#8B1A1A]"></div>
                    <span class="text-[#666666]">Internal</span>
                  </div>
                  <span class="text-[#1A0000] font-medium">
                    {{ formatCurrency(internalTotal) }} 
                    <span class="text-xs text-[#888888] ml-1">({{ Math.round((internalTotal / rollup.total_cost) * 100) }}%)</span>
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                    <span class="text-[#666666]">External</span>
                  </div>
                  <span class="text-[#1A0000] font-medium">
                    {{ formatCurrency(externalTotal) }}
                    <span class="text-xs text-[#888888] ml-1">({{ Math.round((externalTotal / rollup.total_cost) * 100) }}%)</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Meta Card -->
            <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 space-y-6">
              <div class="space-y-4">
                <div class="flex justify-between items-start">
                  <span class="text-[11px] text-[#888888] tracking-[1.5px] uppercase">Rollup Details</span>
                  <div class="px-2 py-0.5 bg-[#D1FAE5] text-[#2D6A4F] rounded-[4px] text-[10px] font-semibold uppercase">Generated</div>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-sm">
                    <Clock class="w-4 h-4 text-[#888888]" />
                    <span class="text-[#666666]">Jun 12, 2026 at 02:58</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <GraduationCap class="w-4 h-4 text-[#888888]" />
                    <span class="text-[#666666]">{{ rollup.cohort_name }}</span>
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t border-[#C9BDB8]">
                <button
                  @click="handleGenerate"
                  :disabled="generating"
                  class="w-full h-[40px] border border-[#940002] text-[#940002] rounded-[6px] font-sans text-sm font-medium flex items-center justify-center hover:bg-[#F5EDEA] transition-colors disabled:opacity-50"
                  title="Regenerate to include latest session data"
                >
                  <RefreshCw v-if="generating" class="w-4 h-4 mr-2 animate-spin" />
                  <RefreshCw v-else class="w-4 h-4 mr-2" />
                  Regenerate Rollup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Instructor Detail Drawer Overlay -->
    <div 
      v-if="isDrawerOpen" 
      class="fixed inset-0 bg-[#111111]/30 backdrop-blur-sm z-50 flex justify-end transition-opacity"
      @click="isDrawerOpen = false"
    >
      <div 
        class="w-full max-w-[500px] h-full bg-[#E6DDD4] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        @click.stop
      >
        <!-- Drawer Header -->
        <div class="bg-white p-8 border-b border-[#C9BDB8]">
          <div class="flex justify-between items-start mb-6">
            <button @click="isDrawerOpen = false" class="text-[#888888] hover:text-[#1A0000] p-1 -ml-2">
              <ChevronRight class="w-6 h-6 rotate-180" />
            </button>
            <div class="px-3 py-1 bg-[#F5EDEA] text-[#666666] rounded-[4px] text-[11px] font-bold uppercase tracking-widest leading-none">
              Instructor Profile
            </div>
          </div>

          <h2 class="font-serif text-[32px] text-[#1A0000] leading-tight mb-2">
            {{ selectedInstructor?.name }}
          </h2>
          <div class="flex items-center gap-2 mb-6">
            <span 
              class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
              :class="selectedInstructor?.compensation_type === 'internal' 
                ? 'bg-[#940002] text-[#E6DDD4]' 
                : 'border border-[#C9BDB8] text-[#666666]'"
            >
              {{ selectedInstructor?.compensation_type }}
            </span>
          </div>

          <div class="p-4 bg-[#F5EDEA] rounded-[8px] border border-[#C9BDB8]">
            <p class="text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Compensation Formula</p>
            <p class="font-sans text-sm text-[#1A0000]">
              <template v-if="selectedInstructor?.compensation_type === 'internal'">
                {{ formatCurrency(selectedInstructor.fixed_salary) }} (Salary) + 
                ({{ selectedInstructor.delivered_hours }} hrs × {{ selectedInstructor.hourly_rate }} EGP/h) = 
                <b>{{ formatCurrency(selectedInstructor.total_amount) }}</b>
              </template>
              <template v-else-if="selectedInstructor">
                {{ selectedInstructor.delivered_hours }} hrs × {{ selectedInstructor.hourly_rate }} EGP/h = 
                <b>{{ formatCurrency(selectedInstructor.total_amount) }}</b>
              </template>
            </p>
          </div>
        </div>

        <!-- Drawer Content -->
        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <div>
            <h3 class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-4">Delivered Sessions</h3>
            <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden">
              <table class="w-full text-left">
                <thead class="bg-[#F5EDEA] border-b border-[#C9BDB8]">
                  <tr>
                    <th class="p-3 text-[10px] text-[#888888] uppercase tracking-wider">Date</th>
                    <th class="p-3 text-[10px] text-[#888888] uppercase tracking-wider">Type</th>
                    <th class="p-3 text-[10px] text-[#888888] uppercase tracking-wider text-center">Hrs</th>
                    <th class="p-3 text-[10px] text-[#888888] uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#C9BDB8]">
                  <!-- Mock data until API is fully wired -->
                  <tr v-for="i in 5" :key="i" class="text-sm">
                    <td class="p-3 text-[#1A0000]">Jan {{ i + 5 }}, 2026</td>
                    <td class="p-3 text-[#666666]">Lab / Workshop</td>
                    <td class="p-3 text-[#666666] text-center">3h</td>
                    <td class="p-3 text-right">
                      <span class="px-2 py-0.5 bg-[#D1FAE5] text-[#2D6A4F] rounded-[4px] text-[10px] font-semibold uppercase">Delivered</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="p-8 bg-white border-top border-[#C9BDB8]">
          <button 
            @click="isDrawerOpen = false"
            class="w-full h-[40px] bg-[#940002] text-[#E6DDD4] rounded-[6px] font-sans font-medium transition-colors hover:bg-[#7a0002]"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tabular numbers for consistency */
td, p, span {
  font-variant-numeric: tabular-nums;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #C9BDB8;
  border-radius: 3px;
}
</style>
