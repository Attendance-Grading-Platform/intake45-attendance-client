<script setup lang="ts">
import { ref} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface SubmissionRow {
  id: number
  studentName: string
  labGroup: string
  course: string
  deliverable: string
  submittedAt: string
  daysSince: number
  fileType: 'document' | 'image' | 'pdf' | 'zip'
  grade: string | number
}

// Mock Data matching the Zara Heritage UI specification exactly
const submissions = ref<SubmissionRow[]>([
  { id: 1, studentName: 'Liam Gallagher', labGroup: 'ALPHA', course: 'Mech Systems II', deliverable: 'Lab Report #4', submittedAt: 'Oct 12, 14:20', daysSince: 6, fileType: 'document', grade: '—' },
  { id: 2, studentName: 'Sofia Chen', labGroup: 'BETA', course: 'Mech Systems II', deliverable: 'Hydraulics Chart', submittedAt: 'Oct 15, 09:10', daysSince: 3, fileType: 'image', grade: '—' },
  { id: 3, studentName: 'Marcus Thorne', labGroup: 'ALPHA', course: 'Industrial Safety', deliverable: 'Final Essay', submittedAt: 'Oct 17, 11:45', daysSince: 1, fileType: 'pdf', grade: '—' },
  { id: 4, studentName: 'Elena Rodriguez', labGroup: 'BETA', course: 'Mech Systems II', deliverable: 'Lab Report #4', submittedAt: 'Oct 12, 08:30', daysSince: 6, fileType: 'document', grade: '—' },
  { id: 5, studentName: 'Jordan Smith', labGroup: 'GAMMA', course: 'Applied Hydraulics', deliverable: 'System Design', submittedAt: 'Oct 14, 16:55', daysSince: 4, fileType: 'zip', grade: '—' }
])

// Filter states
const selectedCourse = ref('Mechanical Systems II')
const selectedGroup = ref('All Groups')
const selectedStatus = ref('Needs Grading')

// Success toast state
const showToast = ref(false)

function triggerToast() {
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Navigate to the individual deliverables layout safely
function goToGrade(submission: SubmissionRow) {
  triggerToast()
  // Pushes to the deliverables panel we set up earlier
  router.push({
    name: 'instructor-deliverables',
    query: { studentId: submission.id, course: submission.course }
  })
}

// Style helpers for the days-since tags
function getDaysBadgeClass(days: number): string {
  if (days >= 5) return 'bg-red-100 text-red-900 border-red-200'
  if (days >= 3) return 'bg-amber-100 text-amber-900 border-amber-200'
  return 'bg-[#E6DDD4]/50 text-[#4c4546] border-[#C9BDB8]'
}
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans pb-16">
    <div class="max-w-7xl mx-auto px-6 py-10">

      <div class="mb-10">
        <span class="font-sans text-[11px] font-bold text-[#940002] uppercase tracking-[1.5px] mb-2 block">GRADING</span>
        <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <h1 class="font-serif text-[36px] text-[#1b1b1b] leading-tight font-medium">Submission tracker</h1>
          <div class="flex gap-3">
            <div class="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="font-sans text-sm text-amber-900 font-bold">12 ungraded</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="font-sans text-sm text-red-900 font-bold">3 missing</span>
            </div>
          </div>
        </div>
        <hr class="mt-6 border-0 h-px bg-[#C9BDB8]">
      </div>

      <div class="flex flex-wrap gap-6 items-center mb-8 bg-white/40 p-4 rounded-lg border border-[#C9BDB8]/40">
        <div class="flex flex-col gap-1.5 min-w-50">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">COURSE SELECTOR</span>
          <select v-model="selectedCourse" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option>Mechanical Systems II</option>
            <option>Applied Hydraulics</option>
            <option>Industrial Safety</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 min-w-40">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">LAB GROUP</span>
          <select v-model="selectedGroup" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option>All Groups</option>
            <option>Group Alpha</option>
            <option>Group Beta</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 min-w-40">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">STATUS FILTER</span>
          <select v-model="selectedStatus" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option>Needs Grading</option>
            <option>Completed</option>
            <option>Flagged</option>
          </select>
        </div>

        <div class="flex-1"></div>
        <button type="button" class="sm:self-end px-6 py-2.5 bg-[#940002] text-white font-sans font-bold text-sm rounded-md hover:opacity-95 transition-all uppercase tracking-[0.5px]">
          Apply Filters
        </button>
      </div>

      <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden mb-10 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#C9BDB8]/20 border-b border-[#C9BDB8]">
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Student Name</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Lab Group</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Course</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Deliverable</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Submitted</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Days Since</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase text-center">Type</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Grade</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#C9BDB8]/40">
              <tr v-for="row in submissions" :key="row.id" class="hover:bg-[#E6DDD4]/20 transition-colors">
                <td class="px-6 py-4 font-sans text-sm font-bold text-[#1b1b1b] whitespace-nowrap">{{ row.studentName }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-0.5 bg-[#E6DDD4] border border-[#cfc4c5] rounded-full font-sans font-bold text-[10px] text-[#1b1b1b]">
                    {{ row.labGroup }}
                  </span>
                </td>
                <td class="px-6 py-4 font-sans text-sm text-[#1b1b1b] whitespace-nowrap">{{ row.course }}</td>
                <td class="px-6 py-4 font-sans text-sm text-[#1b1b1b] whitespace-nowrap">{{ row.deliverable }}</td>
                <td class="px-6 py-4 font-mono text-xs text-[#4c4546] whitespace-nowrap">{{ row.submittedAt }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 border rounded-full font-mono text-xs font-bold" :class="getDaysBadgeClass(row.daysSince)">
                    {{ row.daysSince }} days
                  </span>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <svg class="w-5 h-5 inline-block text-[#7e7576]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path v-if="row.fileType === 'document' || row.fileType === 'pdf'" stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    <path v-else-if="row.fileType === 'image'" stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5M5 19v-4m14 4v-4m0 0V8a2 2 0 00-2-2h-3m3 3H9"/>
                  </svg>
                </td>
                <td class="px-6 py-4 font-mono text-sm text-[#1b1b1b] whitespace-nowrap">{{ row.grade }}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    @click="goToGrade(row)"
                    class="text-[#940002] font-bold hover:underline font-sans text-sm tracking-[0.5px]"
                  >
                    Grade
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-6 py-3 bg-[#f3f3f3] flex justify-between items-center border-t border-[#C9BDB8]/40">
          <span class="font-sans text-sm text-[#4c4546]">Showing 5 of 15 pending submissions</span>
          <div class="flex gap-1">
            <button type="button" class="p-1 hover:bg-[#E6DDD4] rounded transition-colors text-[#1b1b1b]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button type="button" class="p-1 hover:bg-[#E6DDD4] rounded transition-colors text-[#1b1b1b]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-white border border-[#C9BDB8] rounded-[10px] flex flex-col gap-3">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1.5px] uppercase">AVERAGE RESPONSE TIME</span>
          <div class="flex items-baseline gap-1">
            <span class="font-serif text-[36px] font-medium text-[#1b1b1b] leading-none">3.2</span>
            <span class="font-sans text-sm text-[#4c4546]">days</span>
          </div>
          <div class="w-full bg-[#eeeeee] rounded-full h-1.5 overflow-hidden">
            <div class="bg-[#940002] h-full" style="width: 65%;"></div>
          </div>
        </div>

        <div class="p-6 bg-white border border-[#C9BDB8] rounded-[10px] flex flex-col gap-3">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1.5px] uppercase">GRADING THROUGHPUT</span>
          <div class="flex items-baseline gap-1">
            <span class="font-serif text-[36px] font-medium text-[#1b1b1b] leading-none">88%</span>
            <span class="font-sans text-sm text-[#4c4546]">completion</span>
          </div>
          <div class="w-full bg-[#eeeeee] rounded-full h-1.5 overflow-hidden">
            <div class="bg-[#1b1b1b] h-full" style="width: 88%;"></div>
          </div>
        </div>

        <div class="p-6 bg-white border border-[#C9BDB8] rounded-[10px] flex flex-col gap-3">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1.5px] uppercase">CRITICAL SUBMISSIONS</span>
          <div class="flex items-baseline gap-1">
            <span class="font-serif text-[36px] font-medium text-red-600 leading-none">3</span>
            <span class="font-sans text-sm text-[#4c4546]">over 5 days</span>
          </div>
          <div class="w-full bg-[#eeeeee] rounded-full h-1.5 overflow-hidden">
            <div class="bg-red-500 h-full" style="width: 20%;"></div>
          </div>
        </div>
      </div>

    </div>

    <Transition name="toast-fade">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 bg-[#1b1b1b] text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 z-50"
      >
        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="font-sans text-sm">Loading individual panel...</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 300ms ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(20px); }
</style>
