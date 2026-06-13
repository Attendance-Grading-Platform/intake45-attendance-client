<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCohortStore } from '@/stores/cohort.store';
import { useAtRisk } from '@/composables/useAtRisk';

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

const activeAtRiskCohortName = computed(() => {
  return cohorts.value.find((c: any) => c.cohort_id === selectedCohortId.value)?.cohort_name ?? 'Unknown Cohort';
});
</script>

<template>
  <div class="bg-[#FFFFFF] p-[24px] rounded-[10px] border border-[#E0D4B8]">
      
      <div class="mb-6">
        <h3 class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
          Branch Manager View
        </h3>
        <h1 class="font-serif text-[26px] text-[#000000] leading-none mb-4">
          Dashboard
        </h1>
        <hr class="border-t border-[#E0D4B8]" />
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
            v-for="student in atRiskStudents" 
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
              @click.stop.prevent="cohortStore.openStudentProfile(student.student_id, student.name, activeAtRiskCohortName, student.lab_group_name ?? 'Unassigned')"
              class="text-[12px] font-medium text-[#8B1A1A] underline-offset-2 hover:underline focus:outline-none relative z-50 cursor-pointer text-left w-max"
              :aria-label="`View profile for ${student.name}`"
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
              v-for="student in cohortStore.students" 
              :key="student.id"
              class="border-b border-[#E0D4B8] last:border-b-0 hover:bg-[#FAFAFA] transition-colors group"
            >
              <td class="py-4 px-4 font-sans text-[14px] text-[#000000]">{{ student.name }}</td>
              <td class="py-4 px-4 font-sans text-[14px] text-[#666666]">{{ student.email }}</td>
              <td class="py-4 px-4 text-right">
                <button 
                  @click.stop.prevent="cohortStore.openStudentProfile(student.id, student.name, activeCohortName, student.lab_group_name ?? 'Unassigned')"
                  class="text-[12px] font-medium text-[#8B1A1A] underline-offset-2 hover:underline focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap relative z-50 cursor-pointer"
                  :aria-label="`View profile for ${student.name}`"
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
      
    </div>
</template>
