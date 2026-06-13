<script setup lang="ts">
import { ref } from "vue";
import { useCohortStore } from "@/stores/cohort.store";
import SubmitButton from "@/components/forms/SubmitButton.vue";
import axios from "@/api/axios"; // Added the Axios import
import { PREDEFINED_TAGS } from "@/constants/tags";

const cohortStore = useCohortStore();
const activeTab = ref<"overview" | "attendance" | "grades">("overview");
const newNoteText = ref("");
const selectedTag = ref<string>("");
const isSubmittingNote = ref(false);

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const submitNote = async () => {
  if (!newNoteText.value.trim() || !cohortStore.activeStudentId) return;

  isSubmittingNote.value = true;

  try {
    const payload: Record<string, any> = { note: newNoteText.value };
    if (selectedTag.value) payload.tag = selectedTag.value;

    // 1. Send the POST request to the existing team endpoint
    await axios.post(`/v1/students/${cohortStore.activeStudentId}/notes`, payload);

    // 2. Clear the textarea upon success
    newNoteText.value = "";
    selectedTag.value = "";

    // 3. Re-fetch the notes to instantly update the UI feed
    const notesRes = await axios.get(`/v1/students/${cohortStore.activeStudentId}/notes`);
    cohortStore.notes = notesRes.data?.data || [];
  } catch (error) {
    console.error("Failed to save the note:", error);
  } finally {
    isSubmittingNote.value = false;
  }
};

import { computed } from "vue";

const groupedGrades = computed(() => {
  const groups: Record<string, any[]> = {};
  const grades = cohortStore.analytics?.grades_breakdown;
  
  if (!grades) return groups;
  
  grades.forEach(grade => {
    if (!groups[grade.course_name]) {
      groups[grade.course_name] = [];
    }
    groups[grade.course_name]!.push(grade);
  });
  return groups;
});
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="cohortStore.isStudentDrawerOpen" 
      class="fixed inset-0 bg-[#111111]/30 z-[100]"
      @click="cohortStore.closeStudentProfile"
    ></div>
  </Transition>

  <Transition name="slide">
    <div 
      v-if="cohortStore.isStudentDrawerOpen" 
      class="fixed inset-y-0 right-0 w-full max-w-[440px] bg-[#FFFFFF] shadow-2xl z-[101] flex flex-col"
    >
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 relative">
        <button 
          @click="cohortStore.closeStudentProfile"
          class="absolute top-6 right-6 text-[24px] leading-none text-[#888888] hover:text-[#000000] transition-colors"
        >
          &times;
        </button>
        <h2 class="font-serif text-[24px] text-[#000000] mb-1">
          {{ cohortStore.activeStudentName }}
        </h2>
        <p class="font-sans text-[14px] text-[#666666] mb-4">
          {{ cohortStore.activeLabGroupName }} &bull; {{ cohortStore.activeCohortName }}
        </p>
        <hr class="border-t border-[#E0D4B8]" />
      </div>

      <!-- Navigation -->
      <div class="px-6 flex space-x-6 border-b border-[#E0D4B8]">
        <button 
          v-for="tab in ['overview', 'attendance', 'grades']" 
          :key="tab"
          @click="activeTab = tab as any"
          class="pb-3 text-[14px] font-sans capitalize transition-colors"
          :class="activeTab === tab ? 'border-b-2 border-[#000000] text-[#000000] font-medium' : 'text-[#888888] hover:text-[#000000]'"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
        <div v-if="cohortStore.isLoading" class="flex justify-center py-10">
          <span class="text-[14px] text-[#888888]">Loading profile...</span>
        </div>

        <div v-else-if="activeTab === 'overview'" class="space-y-8">
          <!-- Tags Section -->
          <section>
            <h3 class="font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider mb-3">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="item in cohortStore.tags" 
                :key="item.id"
                class="px-3 py-1 bg-[#EBEBEB] text-[#333333] text-[12px] font-sans rounded-full"
              >
                {{ item.tag }}
              </span>
              <span v-if="!cohortStore.tags.length" class="text-[13px] text-[#888888]">No tags applied.</span>
            </div>
          </section>

          <hr class="border-t border-[#E0D4B8]" />

          <!-- Notes Section -->
          <section>
            <h3 class="font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider mb-4">Notes</h3>
            
            <div class="space-y-4 mb-6">
              <div 
                v-for="item in cohortStore.notes" 
                :key="item.id"
                class="bg-[#FFFFFF] p-4 rounded-[6px] border border-[#E0D4B8]"
              >
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-sans text-[13px] font-medium text-[#000000]">{{ item.creator?.name || 'Instructor' }}</span>
                    <span 
                      v-if="item.tag && item.tag !== 'note'" 
                      class="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-medium rounded-[4px] px-2 py-[2px] uppercase tracking-wider"
                    >
                      {{ item.tag }}
                    </span>
                  </div>
                  <span class="font-sans text-[11px] text-[#888888]">{{ formatDate(item.created_at) }}</span>
                </div>
                <p class="font-sans text-[14px] text-[#444444] whitespace-pre-wrap">{{ item.note }}</p>
              </div>
              <div v-if="!cohortStore.notes.length" class="text-[13px] text-[#888888] py-2">
                No notes available.
              </div>
            </div>

            <!-- Add Note -->
            <form @submit.prevent="submitNote" class="mt-6">
              <div class="mb-3 flex flex-wrap gap-2">
                <button 
                  v-for="tag in PREDEFINED_TAGS" 
                  :key="tag"
                  type="button"
                  @click="selectedTag = selectedTag === tag ? '' : tag"
                  :class="selectedTag === tag ? 'bg-[#8B1A1A] text-[#FFFFFF] border-[#8B1A1A] font-medium' : 'bg-[#FAFAFA] text-[#666666] border border-[#E0D4B8] hover:border-[#8B1A1A] hover:text-[#8B1A1A]'"
                  class="rounded-full px-3 py-1.5 text-[12px] font-sans transition-all border"
                >
                  {{ tag }}
                </button>
              </div>
              <textarea 
                v-model="newNoteText"
                rows="3"
                placeholder="Add a new note..."
                class="w-full p-3 rounded-[6px] border border-[#E0D4B8] bg-[#FFFFFF] font-sans text-[14px] focus:outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] transition-colors mb-3 resize-none"
              ></textarea>
              <SubmitButton 
                :loading="isSubmittingNote"
                class="w-full h-[38px] rounded-[6px] bg-[#000000] text-[#FFFFFF] font-sans text-[14px] hover:bg-[#111111] transition-colors"
              >
                Save Note
              </SubmitButton>
            </form>
          </section>
        </div>
        
        <div v-else-if="activeTab === 'attendance'" class="space-y-8">
          <section>
            <div class="bg-[#FFFFFF] p-5 rounded-[6px] border border-[#E0D4B8] flex justify-between items-center">
              <div>
                <h3 class="font-sans text-[12px] font-medium text-[#888888] uppercase tracking-wider mb-1">Ledger Balance</h3>
                <p class="font-serif text-[32px] leading-none" :class="cohortStore.analytics?.is_at_risk ? 'text-[#92400E]' : 'text-[#000000]'">
                  {{ cohortStore.analytics?.ledger_balance ?? '--' }} <span class="text-[14px] font-sans text-[#888888]">/ 250</span>
                </p>
              </div>
              <div v-if="cohortStore.analytics?.is_at_risk" class="px-3 py-1 bg-[#FEF3C7] text-[#92400E] text-[12px] font-medium rounded-[4px] border border-[#F59E0B]">
                At Risk
              </div>
            </div>
          </section>

          <section>
            <h3 class="font-sans text-[12px] font-medium text-[#000000] uppercase tracking-wider mb-4">Recent Records</h3>
            <div class="space-y-3">
              <div 
                v-for="record in cohortStore.attendanceRecords" 
                :key="record.id"
                class="bg-[#FFFFFF] p-4 rounded-[6px] border border-[#E0D4B8] flex justify-between items-center"
              >
                <div>
                  <p class="font-sans text-[14px] font-medium text-[#000000]">{{ record.session?.engagement?.title || 'Session' }}</p>
                  <p class="font-sans text-[12px] text-[#888888]">{{ record.session?.session_date ? formatDate(record.session.session_date) : 'Unknown Date' }}</p>
                </div>
                <div>
                  <span v-if="record.arrived_at" class="px-2 py-1 bg-[#EBEBEB] text-[#333333] text-[11px] font-sans rounded-[4px]">
                    Present
                  </span>
                  <span v-else class="px-2 py-1 bg-[#FEF2F2] text-[#991B1B] text-[11px] font-sans rounded-[4px] border border-[#FECACA]">
                    Absent
                  </span>
                </div>
              </div>
              <div v-if="!cohortStore.attendanceRecords?.length" class="text-[13px] text-[#888888]">
                No attendance records found.
              </div>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'grades'" class="space-y-4">
          <details 
            v-for="(grades, courseName) in groupedGrades" 
            :key="courseName"
            class="bg-[#FFFFFF] rounded-[6px] border border-[#E0D4B8] group"
          >
            <summary class="p-4 font-sans text-[14px] font-medium text-[#000000] cursor-pointer list-none flex justify-between items-center group-open:border-b group-open:border-[#E0D4B8] focus:outline-none">
              {{ courseName }}
              <svg class="w-4 h-4 text-[#888888] transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </summary>
            <div class="p-4 bg-[#FAFAFA] space-y-3">
              <div 
                v-for="(grade, idx) in grades" 
                :key="idx"
                class="flex justify-between items-center border-b border-[#E0D4B8] last:border-0 pb-3 last:pb-0"
              >
                <div>
                  <p class="font-sans text-[13px] text-[#000000] capitalize">{{ grade.component_type }}</p>
                  <p class="font-sans text-[11px] text-[#888888]">Weight: {{ grade.component_weight }}%</p>
                </div>
                <div class="text-right">
                  <p class="font-sans text-[14px] font-medium text-[#000000]">{{ grade.raw_score }} / {{ grade.raw_max }}</p>
                  <p class="font-sans text-[11px] text-[#888888]">{{ grade.normalized_score }} pts</p>
                </div>
              </div>
            </div>
          </details>

          <div v-if="Object.keys(groupedGrades).length === 0" class="text-[13px] text-[#888888]">
            No grades available yet.
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
