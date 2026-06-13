<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSubmissionQueue, getSubmissionStats, type SubmissionQueueParams } from '@/api/modules/submission.api'

const router = useRouter()

interface CourseFilter { id: number | string; name: string }
interface GroupFilter  { id: number | string; name: string }

interface SubmissionRow {
  id: number
  student?: { name?: string; enrolled_lab_groups?: { name: string }[] }
  course_component?: { type?: string; course?: { name?: string } }
  created_at: string
  days_since?: number
  grade?: unknown
}

// Stats from API
const ungradedCount = ref(0)
const missingCount  = ref(0)
const isLoadingStats = ref(true)

// Filter options from API
const availableCourses = ref<CourseFilter[]>([])
const availableGroups  = ref<GroupFilter[]>([])

// Submission data from API
const submissions = ref<SubmissionRow[]>([])
const isLoading   = ref(true)

// Filter state
const selectedCourse = ref<number | string>('')
const selectedGroup  = ref<number | string>('')
const selectedStatus = ref('')

// Toast
const showToast = ref(false)

function triggerToast() {
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

async function loadStats() {
  isLoadingStats.value = true
  try {
    const res = await getSubmissionStats()
    const data = res.data.data
    ungradedCount.value = data.ungraded_count ?? 0
    missingCount.value  = data.missing_count  ?? 0
    if (data.available_filters) {
      availableCourses.value = data.available_filters.courses    ?? []
      availableGroups.value  = data.available_filters.lab_groups ?? []
    }
  } catch (err) {
    console.error('Failed to load submission stats:', err)
  } finally {
    isLoadingStats.value = false
  }
}

async function loadSubmissions() {
  isLoading.value = true
  try {
    const params: SubmissionQueueParams = {}
    if (selectedCourse.value) params.course_id    = selectedCourse.value
    if (selectedGroup.value)  params.lab_group_id = selectedGroup.value
    if (selectedStatus.value) params.status        = selectedStatus.value

    const res = await getSubmissionQueue(params)
    const payload = res.data.data
    submissions.value = (Array.isArray(payload) ? payload : (payload?.data ?? [])) as SubmissionRow[]
  } catch (err) {
    console.error('Failed to load deliverables queue:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadStats(), loadSubmissions()])
})

function applyFilters() {
  loadSubmissions()
}

function goToGrade(submission: SubmissionRow) {
  triggerToast()
  router.push({ name: 'instructor-submissions', query: { studentId: submission.id } })
}

function getDaysBadgeClass(days: number): string {
  if (days >= 5) return 'bg-red-100 text-red-900 border-red-200'
  if (days >= 3) return 'bg-amber-100 text-amber-900 border-amber-200'
  return 'bg-[#E6DDD4]/50 text-[#4c4546] border-[#C9BDB8]'
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
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
              <span class="font-sans text-sm text-amber-900 font-bold">
                <template v-if="isLoadingStats">…</template>
                <template v-else>{{ ungradedCount }} ungraded</template>
              </span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="font-sans text-sm text-red-900 font-bold">
                <template v-if="isLoadingStats">…</template>
                <template v-else>{{ missingCount }} missing</template>
              </span>
            </div>
          </div>
        </div>
        <hr class="mt-6 border-0 h-px bg-[#C9BDB8]">
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-6 items-center mb-8 bg-white/40 p-4 rounded-lg border border-[#C9BDB8]/40">
        <div class="flex flex-col gap-1.5 min-w-50">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">COURSE SELECTOR</span>
          <select v-model="selectedCourse" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option value="">All Courses</option>
            <option v-for="course in availableCourses" :key="course.id" :value="course.id">{{ course.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 min-w-40">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">LAB GROUP</span>
          <select v-model="selectedGroup" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option value="">All Groups</option>
            <option v-for="group in availableGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 min-w-40">
          <span class="font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px]">STATUS FILTER</span>
          <select v-model="selectedStatus" class="bg-white border border-[#C9BDB8] rounded-md px-4 py-2 text-sm focus:ring-0 focus:border-[#940002]">
            <option value="">All Statuses</option>
            <option value="pending">Needs Grading</option>
            <option value="graded">Completed</option>
          </select>
        </div>

        <div class="flex-1"></div>
        <button type="button" @click="applyFilters" class="sm:self-end px-6 py-2.5 bg-[#940002] text-white font-sans font-bold text-sm rounded-md hover:opacity-95 transition-all uppercase tracking-[0.5px]">
          Apply Filters
        </button>
      </div>

      <!-- Table -->
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
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase">Grade</th>
                <th class="px-6 py-4 font-sans text-[11px] font-bold text-[#4c4546] tracking-[1px] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#C9BDB8]/40">
              <!-- Skeleton loader -->
              <template v-if="isLoading">
                <tr v-for="i in 5" :key="`sk-${i}`" class="animate-pulse">
                  <td v-for="j in 8" :key="j" class="px-6 py-4">
                    <div class="h-4 bg-[#C9BDB8]/40 rounded"></div>
                  </td>
                </tr>
              </template>

              <!-- Empty state -->
              <tr v-else-if="submissions.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-sm text-[#4c4546] italic">
                  No submissions found for the current filters.
                </td>
              </tr>

              <!-- Data rows -->
              <template v-else>
                <tr v-for="row in submissions" :key="row.id" class="hover:bg-[#E6DDD4]/20 transition-colors">
                  <td class="px-6 py-4 font-sans text-sm font-bold text-[#1b1b1b] whitespace-nowrap">
                    {{ row.student?.name ?? '—' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span v-if="row.student?.enrolled_lab_groups?.length" class="px-2 py-0.5 bg-[#E6DDD4] border border-[#cfc4c5] rounded-full font-sans font-bold text-[10px] text-[#1b1b1b]">
                      {{ row.student.enrolled_lab_groups[0].name }}
                    </span>
                    <span v-else class="text-[#4c4546] text-xs">—</span>
                  </td>
                  <td class="px-6 py-4 font-sans text-sm text-[#1b1b1b] whitespace-nowrap">
                    {{ row.course_component?.course?.name ?? '—' }}
                  </td>
                  <td class="px-6 py-4 font-sans text-sm text-[#1b1b1b] whitespace-nowrap capitalize">
                    {{ row.course_component?.type ?? '—' }}
                  </td>
                  <td class="px-6 py-4 font-mono text-xs text-[#4c4546] whitespace-nowrap">
                    {{ formatDate(row.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 border rounded-full font-mono text-xs font-bold" :class="getDaysBadgeClass(row.days_since ?? 0)">
                      {{ row.days_since ?? 0 }} days
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-sm text-[#1b1b1b] whitespace-nowrap">
                    <span v-if="row.grade" class="text-green-700 font-bold">Graded</span>
                    <span v-else class="text-[#4c4546]">—</span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      @click="goToGrade(row)"
                      class="text-[#940002] font-bold hover:underline font-sans text-sm tracking-[0.5px]"
                    >
                      {{ row.grade ? 'Re-grade' : 'Grade' }}
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="px-6 py-3 bg-[#f3f3f3] flex justify-between items-center border-t border-[#C9BDB8]/40">
          <span class="font-sans text-sm text-[#4c4546]">
            {{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }} shown
          </span>
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
        <span class="font-sans text-sm">Opening grading panel…</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 300ms ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(20px); }
</style>
