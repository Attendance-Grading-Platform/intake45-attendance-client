<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getSubmissionQueue, getSubmissionStats, type SubmissionQueueParams } from '@/api/modules/submission.api'

// ── State ───────────────────────────────────────────────────────────────
const isLoadingStats = ref(true)
const isLoadingQueue = ref(true)

const stats = ref<any>(null)
const queueData = ref<any[]>([])

// Filters
const filters = ref<SubmissionQueueParams>({
  page: 1,
  course_id: '',
  lab_group_id: '',
  status: '',
})

// Pagination info from Laravel LengthAwarePaginator
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
})

// Dropdown data from stats.available_filters
const availableCourses = ref<any[]>([])
const availableLabGroups = ref<any[]>([])

// ── Data Fetching ───────────────────────────────────────────────────────
const fetchStats = async () => {
  isLoadingStats.value = true
  try {
    const res = await getSubmissionStats()
    stats.value = res.data.data
    
    // Populate available filters from backend
    if (stats.value.available_filters) {
      availableCourses.value = stats.value.available_filters.courses || []
      availableLabGroups.value = stats.value.available_filters.lab_groups || []
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

const fetchQueue = async () => {
  isLoadingQueue.value = true
  try {
    const payload: SubmissionQueueParams = { page: pagination.value.current_page }
    if (filters.value.course_id) payload.course_id = filters.value.course_id
    if (filters.value.lab_group_id) payload.lab_group_id = filters.value.lab_group_id
    if (filters.value.status) payload.status = filters.value.status

    const res = await getSubmissionQueue(payload)
    const paginator = res.data.data
    
    queueData.value = paginator.data
    pagination.value = {
      current_page: paginator.current_page,
      last_page: paginator.last_page,
      total: paginator.total,
    }
  } catch (error) {
    console.error('Failed to load queue:', error)
  } finally {
    isLoadingQueue.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchQueue()])
})

// ── Actions ─────────────────────────────────────────────────────────────
const applyFilters = () => {
  pagination.value.current_page = 1 // Reset to first page
  fetchQueue()
}

const changePage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return
  pagination.value.current_page = page
  fetchQueue()
}

const handleGrade = (_submission: Record<string, unknown>) => {}

// ── Helpers ─────────────────────────────────────────────────────────────
const getUrgencyClass = (daysSince: number) => {
  if (daysSince > 5) return 'bg-red-50 text-red-700 ring-red-600/10'
  if (daysSince > 2) return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  return 'bg-neutral-50 text-neutral-600 ring-neutral-500/10'
}

const getUrgencyText = (daysSince: number) => {
  if (daysSince === 0) return 'Today'
  if (daysSince === 1) return '1 day ago'
  return `${daysSince} days ago`
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6 space-y-8 min-h-[calc(100vh-56px)]">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-neutral-200 pb-4">
      <div>
        <h3 class="font-sans text-label uppercase tracking-widest text-neutral-500 mb-1">
          Grading Queue
        </h3>
        <h1 class="font-serif text-h1 text-neutral-900">Submission tracker</h1>
      </div>

      <!-- Header Summary Chips -->
      <div class="flex gap-3">
        <!-- Ungraded Chip -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <div class="w-2 h-2 rounded-full bg-amber-500"></div>
          <span class="text-sm font-semibold text-amber-800">
            <template v-if="isLoadingStats">...</template>
            <template v-else>{{ stats?.ungraded_count || 0 }} ungraded</template>
          </span>
        </div>
        <!-- Missing Chip -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
          <div class="w-2 h-2 rounded-full bg-red-500"></div>
          <span class="text-sm font-semibold text-red-800">
            <template v-if="isLoadingStats">...</template>
            <template v-else>{{ stats?.missing_count || 0 }} missing</template>
          </span>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-neutral-0 rounded-card border border-neutral-200 p-4 shadow-sm flex flex-col md:flex-row items-end gap-4">
      <div class="w-full md:w-1/4">
        <label class="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Course</label>
        <select
          v-model="filters.course_id"
          class="w-full rounded-btn border-neutral-300 bg-neutral-50 px-3 py-2 text-sm shadow-sm focus:border-brand-red focus:ring-brand-red disabled:opacity-50"
          :disabled="isLoadingStats"
        >
          <option value="">All Courses</option>
          <option v-for="course in availableCourses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
      </div>

      <div class="w-full md:w-1/4">
        <label class="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Lab Group</label>
        <select
          v-model="filters.lab_group_id"
          class="w-full rounded-btn border-neutral-300 bg-neutral-50 px-3 py-2 text-sm shadow-sm focus:border-brand-red focus:ring-brand-red disabled:opacity-50"
          :disabled="isLoadingStats"
        >
          <option value="">All Lab Groups</option>
          <option v-for="group in availableLabGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <div class="w-full md:w-1/4">
        <label class="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Status</label>
        <select
          v-model="filters.status"
          class="w-full rounded-btn border-neutral-300 bg-neutral-50 px-3 py-2 text-sm shadow-sm focus:border-brand-red focus:ring-brand-red"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="graded">Graded</option>
        </select>
      </div>

      <div class="w-full md:w-auto ml-auto">
        <button
          @click="applyFilters"
          :disabled="isLoadingQueue"
          class="w-full md:w-auto bg-neutral-900 text-white px-5 py-2 rounded-btn font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-neutral-0 rounded-card border border-neutral-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-neutral-50 border-b border-neutral-200">
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold w-1/5">Student Name</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold w-1/6">Lab Group</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold w-1/5">Course</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold w-1/5">Deliverable</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold w-1/6">Submitted</th>
              <th class="py-3 px-6 font-sans text-xs uppercase tracking-wider text-neutral-500 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <!-- Skeleton Loader -->
            <template v-if="isLoadingQueue">
              <tr v-for="i in 5" :key="`skeleton-${i}`" class="animate-pulse">
                <td class="py-4 px-6"><div class="h-4 bg-neutral-200 rounded w-3/4"></div></td>
                <td class="py-4 px-6"><div class="h-5 bg-neutral-200 rounded-full w-20"></div></td>
                <td class="py-4 px-6"><div class="h-4 bg-neutral-200 rounded w-full"></div></td>
                <td class="py-4 px-6"><div class="h-4 bg-neutral-200 rounded w-5/6"></div></td>
                <td class="py-4 px-6">
                  <div class="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                  <div class="h-5 bg-neutral-200 rounded-full w-16"></div>
                </td>
                <td class="py-4 px-6 text-right"><div class="h-4 bg-neutral-200 rounded w-12 ml-auto"></div></td>
              </tr>
            </template>
            
            <!-- Empty State -->
            <tr v-else-if="queueData.length === 0">
              <td colspan="6" class="py-12 px-6 text-center text-neutral-500 font-sans">
                No submissions found matching your filters.
              </td>
            </tr>

            <!-- Data Rows -->
            <template v-else>
              <tr v-for="item in queueData" :key="item.id" class="hover:bg-neutral-50 transition-colors group">
                <!-- Student Name -->
                <td class="py-4 px-6 font-sans text-sm font-semibold text-neutral-900">
                  {{ item.student?.name || 'Unknown Student' }}
                </td>
                <!-- Lab Group Pill -->
                <td class="py-4 px-6">
                  <span v-if="item.student?.enrolled_lab_groups && item.student.enrolled_lab_groups.length" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {{ item.student.enrolled_lab_groups[0].name }}
                  </span>
                  <span v-else class="text-neutral-400 text-sm">-</span>
                </td>
                <!-- Course -->
                <td class="py-4 px-6 font-sans text-sm text-neutral-600">
                  {{ item.course_component?.course?.name || '-' }}
                </td>
                <!-- Deliverable (Component type) -->
                <td class="py-4 px-6 font-sans text-sm text-neutral-600 capitalize">
                  {{ item.course_component?.type || '-' }}
                </td>
                <!-- Submitted Date & Urgency Chip -->
                <td class="py-4 px-6 font-sans">
                  <div class="text-sm text-neutral-900 mb-1">{{ formatDate(item.created_at) }}</div>
                  <span
                    v-if="!item.grade"
                    :class="['inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', getUrgencyClass(item.days_since)]"
                  >
                    {{ getUrgencyText(item.days_since) }}
                  </span>
                  <span v-else class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Graded
                  </span>
                </td>
                <!-- Actions -->
                <td class="py-4 px-6 text-right">
                  <button
                    @click="handleGrade(item)"
                    class="font-sans text-sm font-bold text-brand-red hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {{ item.grade ? 'Re-grade' : 'Grade' }}
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total > 0 && !isLoadingQueue" class="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
        <span class="text-sm text-neutral-500">
          Showing <span class="font-medium text-neutral-900">{{ queueData.length }}</span> of <span class="font-medium text-neutral-900">{{ pagination.total }}</span> results
        </span>
        <div class="flex gap-2">
          <button
            @click="changePage(pagination.current_page - 1)"
            :disabled="pagination.current_page <= 1"
            class="px-3 py-1 rounded border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.current_page + 1)"
            :disabled="pagination.current_page >= pagination.last_page"
            class="px-3 py-1 rounded border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Footer Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
      <!-- Avg Response Time -->
      <div class="bg-neutral-0 rounded-card border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Avg Response Time</h4>
          
          <div v-if="isLoadingStats" class="h-8 bg-neutral-200 rounded w-24 animate-pulse mt-2"></div>
          <div v-else class="flex items-baseline gap-2">
            <span class="text-3xl font-serif font-bold text-neutral-900">{{ stats?.avg_response_days || 0 }}</span>
            <span class="text-sm font-medium text-neutral-500">days</span>
          </div>
        </div>
      </div>

      <!-- Grading Throughput -->
      <div class="bg-neutral-0 rounded-card border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Grading Throughput</h4>
          
          <div v-if="isLoadingStats" class="h-8 bg-neutral-200 rounded w-24 animate-pulse mt-2"></div>
          <div v-else class="flex items-baseline gap-2">
            <span class="text-3xl font-serif font-bold text-neutral-900">{{ stats?.throughput_percentage || 0 }}</span>
            <span class="text-lg font-bold text-neutral-400">%</span>
          </div>
        </div>
      </div>

      <!-- Critical Submissions -->
      <div class="bg-neutral-0 rounded-card border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-1">Critical (&gt; 5 days)</h4>
          
          <div v-if="isLoadingStats" class="h-8 bg-neutral-200 rounded w-24 animate-pulse mt-2"></div>
          <div v-else class="flex items-baseline gap-2">
            <span class="text-3xl font-serif font-bold text-brand-red">{{ stats?.critical_count || 0 }}</span>
            <span class="text-sm font-medium text-neutral-500">waiting</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
