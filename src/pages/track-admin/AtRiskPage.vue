<script setup lang="ts">
import { onMounted } from 'vue';
import { useAtRisk } from '@/composables/useAtRisk';
import { useCohortStore } from '@/stores/cohort.store';

const cohortStore = useCohortStore();
const { 
  cohorts, 
  selectedCohortId, 
  atRiskStudents, 
  isLoading, 
  fetchCohortsAndInitialAtRisk, 
  selectCohort 
} = useAtRisk();

onMounted(async () => {
  await fetchCohortsAndInitialAtRisk();
});
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-8">
    
    <!-- Page Header -->
    <div>
      <h3 class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
        Track Admin View
      </h3>
      <h1 class="font-serif text-[26px] text-slate-800 leading-none mb-4">
        At-Risk Students
      </h1>
      <p class="text-slate-500 mt-1 mb-4">
        Monitor students whose attendance ledger has fallen below the 150-point warning threshold.
      </p>
      <hr class="border-t border-[#E0D4B8]" />
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-serif text-xl text-neutral-900">Filter by Cohort</h2>
      <div v-if="cohorts.length > 0">
        <select 
          v-model="selectedCohortId" 
          @change="selectCohort(selectedCohortId as number)"
          class="text-sm bg-slate-50 border border-slate-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option v-for="cohort in cohorts" :key="cohort.cohort_id" :value="cohort.cohort_id">
            {{ cohort.cohort_name }}
          </option>
        </select>
      </div>
    </div>

    <!-- State: Loading -->
    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- State: Empty -->
    <div v-else-if="atRiskStudents.length === 0" class="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center flex flex-col items-center justify-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 class="text-lg font-bold text-emerald-800 mb-1">Excellent!</h3>
      <p class="text-emerald-600">There are no at-risk students in this cohort.</p>
    </div>

    <!-- State: Data Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="student in (atRiskStudents as any[])" 
        :key="student.student_id" 
        class="bg-white border border-rose-200 shadow-sm rounded-xl p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <!-- Warning Top Bar -->
        <div class="absolute top-0 left-0 w-full h-1 bg-warning"></div>
        
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="font-bold text-slate-800 text-lg">{{ student.name }}</h3>
            <p class="text-sm text-slate-500">{{ student.email || 'No email provided' }}</p>
          </div>
          <span class="flex h-3 w-3 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
          </span>
        </div>

        <div class="flex-1 space-y-3">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">Ledger Balance</span>
            <span class="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{{ student.ledger_balance }} / 250</span>
          </div>
          
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">Academic GPA</span>
            <span class="font-bold text-slate-700" :class="{ 'text-rose-600': student.gpa < 60 }">{{ student.gpa ?? 'N/A' }}</span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100">
          <button 
            @click="cohortStore.openStudentProfile(student.student_id, student.name, 'At-Risk Monitoring', 'General')"
            class="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>View Full Profile</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
