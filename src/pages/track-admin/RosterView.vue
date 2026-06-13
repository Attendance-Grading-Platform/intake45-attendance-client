<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p class="text-label text-neutral-500 mb-1">STUDENTS</p>
        <h1 class="font-serif text-h1 text-neutral-800">
          {{ activeCohort ? activeCohort.name + ' roster' : 'Cohort roster' }}
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <!-- Cohort Selector if multiple exist -->
        <div v-if="cohortStore.cohorts.length > 1" class="relative">
          <select
            v-model="selectedCohortId"
            class="appearance-none bg-neutral-0 border border-neutral-300 rounded-input px-4 pr-10 py-2 text-base font-sans text-neutral-800 focus:outline-none focus:border-brand-red"
          >
            <option v-for="c in cohortStore.cohorts" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>

    <hr class="border-neutral-300" />

    <!-- Filters Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-neutral-0 border border-neutral-300 rounded-card p-4">
      <div class="flex flex-wrap items-center gap-4 flex-1">
        <!-- Search -->
        <div class="relative w-full max-w-xs">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search student name..."
            class="block w-full pl-9 pr-3 py-2 bg-neutral-0 border border-neutral-300 rounded-input text-base text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand-red"
          />
        </div>

        <!-- Lab Group Filter -->
        <div class="flex items-center gap-2">
          <span class="text-label text-neutral-500">LAB GROUP</span>
          <div class="relative">
            <select
              v-model="filterLabGroup"
              class="appearance-none bg-neutral-0 border border-neutral-300 rounded-input pl-3 pr-8 py-1.5 text-base font-sans text-neutral-800 focus:outline-none focus:border-brand-red"
            >
              <option value="ALL">All Groups</option>
              <option v-for="g in labGroups" :key="g" :value="g">{{ g }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <span class="text-label text-neutral-500">STATUS</span>
          <div class="relative">
            <select
              v-model="filterStatus"
              class="appearance-none bg-neutral-0 border border-neutral-300 rounded-input pl-3 pr-8 py-1.5 text-base font-sans text-neutral-800 focus:outline-none focus:border-brand-red"
            >
              <option value="ALL">All Status</option>
              <option value="Present">Present</option>
              <option value="At-risk">At-risk</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Export CSV -->
      <button
        @click="exportCSV"
        class="flex items-center gap-2 text-label font-bold text-brand-red hover:text-brand-redHover transition-colors focus:outline-none"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        EXPORT CSV
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="cohortStore.isLoading || analyticsStore.isLoading" class="text-center py-12 text-neutral-600 bg-neutral-0 border border-neutral-300 rounded-card">
      <p class="text-base animate-pulse">Loading roster data...</p>
    </div>

    <!-- Main Content Table -->
    <div v-else class="bg-neutral-0 border border-neutral-300 rounded-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-neutral-300 bg-neutral-50">
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[220px]">NAME</th>
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[130px]">LAB GROUP</th>
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[180px]">ATTENDANCE</th>
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[90px]">GRADE</th>
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[220px]">TAGS</th>
              <th class="p-4.5 text-label text-neutral-500 font-semibold min-w-[120px]">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr
              v-for="student in paginatedStudents"
              :key="student.id"
              class="cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              @click.stop.prevent="cohortStore.openStudentProfile(student.id, student.name, activeCohort?.name || 'Cohort', student.labGroup || 'Unassigned')"
            >
              <!-- Name & Initials Avatar -->
              <td class="p-4.5 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300 text-brand-red flex items-center justify-center font-bold text-sm"
                    :style="{ backgroundColor: getAvatarColor(student.name) }"
                  >
                    {{ getInitials(student.name) }}
                  </div>
                  <span class="text-base font-bold text-brand-red hover:underline cursor-pointer">
                    {{ student.name }}
                  </span>
                </div>
              </td>

              <!-- Lab Group -->
              <td class="p-4.5 whitespace-nowrap">
                <div class="flex items-center">
                  <span
                    v-if="student.labGroup"
                    class="px-2.5 py-1 rounded bg-brand-red text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ student.labGroup }}
                  </span>
                  <span v-else class="text-sm text-neutral-400">—</span>
                </div>
              </td>

              <!-- Attendance Progress Bar -->
              <td class="p-4.5 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-24 h-2 bg-neutral-100 border border-neutral-300 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="student.attendanceRate < 85 ? 'bg-danger' : 'bg-brand-red'"
                      :style="{ width: `${student.attendanceRate}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-neutral-800">
                    {{ student.attendanceRate }}%
                  </span>
                </div>
              </td>

              <!-- Grade GPA -->
              <td class="p-4.5 whitespace-nowrap">
                <span class="text-sm font-bold text-neutral-800">
                  {{ student.gpa.toFixed(1) }}
                </span>
              </td>

              <!-- Tags -->
              <td class="p-4.5">
                <div class="flex flex-wrap gap-1.5 max-w-[220px]">
                  <span
                    v-for="tag in student.tags"
                    :key="tag.id"
                    class="px-2 py-0.5 border rounded text-[10px] font-sans font-medium uppercase tracking-wider whitespace-nowrap"
                    :class="isDangerTag(tag.tag) ? 'border-danger text-danger bg-danger-light' : 'border-neutral-300 text-neutral-600 bg-neutral-50'"
                  >
                    {{ formatTag(tag.tag) }}
                  </span>
                  <span v-if="student.tags.length === 0" class="text-sm text-neutral-400">—</span>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="p-4.5 whitespace-nowrap">
                <span class="text-sm font-medium text-neutral-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="getStatusDotClass(student.status)"></span>
                  {{ student.status }}
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredStudents.length === 0">
              <td colspan="6" class="p-8 text-center text-neutral-500">
                No students match the selected filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div class="flex items-center justify-between border-t border-neutral-300 p-4.5 bg-neutral-50">
        <span class="text-sm text-neutral-600">
          Showing {{ startRange }} to {{ endRange }} of {{ filteredStudents.length }} students
        </span>

        <div class="flex items-center gap-2">
          <!-- Prev Button -->
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="text-label font-bold text-brand-red disabled:text-neutral-400 transition-colors focus:outline-none"
          >
            PREV
          </button>

          <!-- Pages -->
          <div class="flex items-center gap-1">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
              class="w-8 h-8 rounded flex items-center justify-center font-sans text-sm font-bold transition-colors"
              :class="currentPage === page ? 'bg-brand-red text-white' : 'text-neutral-600 hover:bg-neutral-100'"
            >
              {{ page }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages || totalPages === 0"
            class="text-label font-bold text-brand-red disabled:text-neutral-400 transition-colors focus:outline-none"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Enrolled -->
      <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
        <p class="text-label text-neutral-500 mb-2">TOTAL ENROLLED</p>
        <p class="font-serif text-data-lg text-brand-red leading-none mb-1">
          {{ totalEnrolled }} Students
        </p>
        <p class="text-sm text-success font-medium">+2 from last week</p>
      </div>

      <!-- Avg Attendance -->
      <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
        <p class="text-label text-neutral-500 mb-2">AVG. ATTENDANCE</p>
        <p class="font-serif text-data-lg text-neutral-800 leading-none mb-4">
          {{ avgAttendance.toFixed(1) }}%
        </p>
        <div class="w-full h-1.5 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden">
          <div class="h-full bg-brand-red rounded-full" :style="{ width: `${avgAttendance}%` }"></div>
        </div>
      </div>

      <!-- Avg Performance -->
      <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
        <p class="text-label text-neutral-500 mb-2">AVG. PERFORMANCE</p>
        <p class="font-serif text-data-lg text-neutral-800 leading-none mb-1">
          {{ avgGPA.toFixed(1) }} GPA
        </p>
        <p class="text-sm text-neutral-500">Cohort benchmark: 3.0</p>
      </div>

      <!-- Flagged Status -->
      <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
        <p class="text-label text-neutral-500 mb-2">FLAGGED STATUS</p>
        <p class="font-serif text-data-lg text-danger leading-none mb-1">
          {{ atRiskCount }} At-risk
        </p>
        <router-link to="/track-admin/at-risk" class="text-sm text-brand-red hover:underline font-bold">
          Review alerts
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCohortStore } from '@/stores/cohort.store'
import { useAnalyticsStore } from '@/stores/analytics.store'

const cohortStore = useCohortStore()
const analyticsStore = useAnalyticsStore()

const selectedCohortId = ref<number | null>(null)
const searchQuery = ref('')
const filterLabGroup = ref('ALL')
const filterStatus = ref('ALL')

// Pagination
const currentPage = ref(1)
const itemsPerPage = 5

// On Mount, fetch cohorts
onMounted(async () => {
  await cohortStore.fetchCohorts()
  
  // Find active cohort or first cohort
  const active = cohortStore.cohorts.find(c => c.status === 'active') || cohortStore.cohorts[0]
  if (active) {
    selectedCohortId.value = active.id
  }
})

// Fetch students and analytics when cohort changes
watch(selectedCohortId, async (newVal) => {
  if (newVal) {
    currentPage.value = 1
    await Promise.all([
      cohortStore.fetchCohortStudents(newVal),
      analyticsStore.fetchCohortAnalytics(newVal)
    ])
  }
})

const activeCohort = computed(() => {
  return cohortStore.cohorts.find(c => c.id === selectedCohortId.value) || null
})

// Dynamic list of unique lab groups present in current cohort students
const labGroups = computed(() => {
  const groups = new Set<string>()
  cohortStore.students.forEach(s => {
    if (s.enrolled_lab_groups && s.enrolled_lab_groups.length > 0) {
      s.enrolled_lab_groups.forEach((lg: { name?: string }) => {
        if (lg.name) groups.add(lg.name)
      })
    }
  })
  return Array.from(groups).sort()
})

// Build full student data row representation
const studentDataRows = computed(() => {
  const analyticsStudents = analyticsStore.cohortAnalytics?.students || []
  
  return cohortStore.students.map(student => {
    // find matching analytics record to get gpa & attendance rate
    const ana = analyticsStudents.find((a: { student_id?: number; attendance_rate?: number; gpa?: number }) => a.student_id === student.id)
    
    const attendanceRate = ana ? Number(ana.attendance_rate) : 100
    // normalize 0-100 GPA to a 4.0 scale for display to match mockup
    const rawGpaPercent = ana ? Number(ana.gpa) : 100
    const gpa = (rawGpaPercent / 100) * 4.0

    // check if student is at_risk
    const isAtRisk = ana ? !!ana.is_at_risk : false
    
    // status: Inactive, At-risk, Present
    let status = 'Present'
    if (!student.is_active) {
      status = 'Inactive'
    } else if (isAtRisk) {
      status = 'At-risk'
    }

    // extract lab group name
    let labGroup = ''
    if (student.enrolled_lab_groups && student.enrolled_lab_groups.length > 0) {
      labGroup = student.enrolled_lab_groups[0].name || ''
    }

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      labGroup,
      attendanceRate,
      gpa,
      tags: student.tags || [],
      status
    }
  })
})

// Filtered students
const filteredStudents = computed(() => {
  return studentDataRows.value.filter(s => {
    // Search filter
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.value.toLowerCase())

    // Lab group filter
    const matchesLab = filterLabGroup.value === 'ALL' || s.labGroup === filterLabGroup.value

    // Status filter
    const matchesStatus = filterStatus.value === 'ALL' || s.status === filterStatus.value

    return matchesSearch && matchesLab && matchesStatus
  })
})

// Paginated students
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredStudents.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / itemsPerPage)
})

const startRange = computed(() => {
  if (filteredStudents.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage + 1
})

const endRange = computed(() => {
  return Math.min(currentPage.value * itemsPerPage, filteredStudents.value.length)
})

// Stats calculations
const totalEnrolled = computed(() => {
  return cohortStore.students.length
})

const avgAttendance = computed(() => {
  const total = studentDataRows.value.reduce((acc, s) => acc + s.attendanceRate, 0)
  return studentDataRows.value.length > 0 ? (total / studentDataRows.value.length) : 0
})

const avgGPA = computed(() => {
  const total = studentDataRows.value.reduce((acc, s) => acc + s.gpa, 0)
  return studentDataRows.value.length > 0 ? (total / studentDataRows.value.length) : 0
})

const atRiskCount = computed(() => {
  return studentDataRows.value.filter(s => s.status === 'At-risk').length
})

// Pagination navigation helpers
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Avatar name helpers
const getInitials = (name: string) => {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length > 1 && parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts[0] && parts[0][0]) {
    return parts[0][0].toUpperCase()
  }
  return ''
}


const getAvatarColor = (name: string) => {
  // Return nice warm tinted colors for avatar background
  const colors = ['#F5EDEA', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#FEE2E2']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const isDangerTag = (tag: string) => {
  const lower = tag.toLowerCase()
  return lower.includes('probation') || lower.includes('risk') || lower.includes('late') || lower.includes('concern') || lower.includes('low')
}

const formatTag = (tag: string) => {
  if (!tag) return ''
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const getStatusDotClass = (status: string) => {
  if (status === 'Present') return 'bg-success'
  if (status === 'At-risk') return 'bg-warning'
  return 'bg-danger' // Inactive
}

// Export current view of students to CSV
const exportCSV = () => {
  if (filteredStudents.value.length === 0) return
  
  const headers = ['Name', 'Lab Group', 'Attendance Rate', 'GPA', 'Status']
  const rows = filteredStudents.value.map(s => [
    s.name,
    s.labGroup || 'N/A',
    `${s.attendanceRate}%`,
    s.gpa.toFixed(2),
    s.status
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${val}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${activeCohort.value?.name || 'Cohort'}_roster.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
