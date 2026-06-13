<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useCohortStore } from '@/stores/cohort.store';


const cohortStore = useCohortStore();

onMounted(async () => {
  try {
    await cohortStore.fetchCohorts();
    const firstCohort = cohortStore.cohorts[0];
    if (firstCohort) {
      await cohortStore.fetchCohortStudents(firstCohort.id);
    }
  } catch (err) {
    console.error('Failed to load instructor dashboard data:', err);
  }
});

const activeCohortName = computed(() => {
  return cohortStore.cohorts[0]?.name ?? 'No Active Cohorts';
});
</script>

<template>
  <div class="bg-[#FFFFFF] p-6 rounded-[10px] border border-[#E0D4B8]">

      <div class="mb-6">
        <h3 class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
          Instructor View
        </h3>
        <h1 class="font-serif text-[26px] text-[#000000] leading-none mb-4">
          {{ activeCohortName }} Roster
        </h1>
        <hr class="border-t border-[#E0D4B8]" />
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
      
    </div>
</template>
