<template>
  <div class="max-w-content mx-auto py-8 px-6 pb-20">
    <!-- Header -->
    <div class="mb-12">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-primary-900 mb-1">Academic Record</h2>
      <h1 class="font-serif text-h1 text-neutral-900">My grades</h1>
    </div>

    <!-- Courses Accordion -->
    <div class="space-y-4 mb-16">
      <div 
        v-for="course in groupedGrades" 
        :key="course.id"
        class="bg-white rounded-[10px] shadow-sm border border-neutral-300 overflow-hidden"
      >
        <!-- Accordion Header -->
        <button 
          @click="toggleCourse(course.id)"
          class="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors text-left"
        >
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {{ course.code }}
            </p>
            <h3 class="font-serif text-xl text-neutral-900">{{ course.name }}</h3>
          </div>
          
          <div class="flex items-center gap-8">
            <div class="hidden sm:block">
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                <span>Score</span>
                <span>{{ Number(course.totalPts).toFixed(1) }} / {{ Number(course.totalWeight).toFixed(1) }}</span>
              </div>
              <div class="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-[#940002] rounded-full" 
                  :style="`width: ${course.totalWeight > 0 ? (course.totalPts / course.totalWeight) * 100 : 0}%`"
                ></div>
              </div>
            </div>

            <div class="text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">QPA</p>
              <p class="font-serif text-xl text-neutral-900">{{ formatQPA(course.qpa) }}</p>
            </div>
            
            <svg 
              class="w-5 h-5 text-neutral-400 transform transition-transform duration-300"
              :class="{ 'rotate-180': expandedCourses.includes(course.id) }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <!-- Accordion Content (Table) -->
        <div v-show="expandedCourses.includes(course.id)" class="border-t border-neutral-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead class="bg-neutral-50">
              <tr>
                <th class="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Component</th>
                <th class="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">Weight</th>
                <th class="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">Score</th>
                <th class="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-neutral-500 text-right">Pts</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr v-for="comp in course.components" :key="comp.id" class="hover:bg-neutral-50">
                <td class="py-4 px-6 text-neutral-900">{{ formatComponentType(comp.type) }}</td>
                <td class="py-4 px-6 text-neutral-600 text-right">{{ comp.weight }}%</td>
                <td class="py-4 px-6 text-neutral-600 text-right">{{ Number(comp.score).toFixed(0) }}/100</td>
                <td class="py-4 px-6 text-neutral-900 text-right font-medium">{{ Number(comp.pts).toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-if="gradeStore.isLoading" class="text-neutral-500 py-8 text-center">
        Loading grades...
      </div>
      <div v-else-if="groupedGrades.length === 0" class="text-neutral-500 py-8 text-center">
        No grades available for your current enrolled courses.
      </div>
    </div>

    <!-- Grand Total Section -->
    <div class="pt-16 border-t border-neutral-300 text-center relative mt-24">
      <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-6">Total Accumulative Performance</p>
      
      <div class="mb-6 drop-shadow-sm">
        <span class="font-serif text-[64px] leading-none text-[#940002] tracking-tight">{{ grandTotal.toFixed(1) }} pts</span>
      </div>
      
      <div class="flex items-center justify-center gap-6 text-sm text-neutral-600">
        <span class="flex items-center gap-2 font-medium">
          <div class="w-2 h-2 rounded-full bg-[#940002]"></div>
          Standing: {{ academicStanding }}
        </span>
        <span class="text-neutral-300">|</span>
        <span>Attendance Ledger: <strong>{{ ledgerBalance }}</strong> pts</span>
        <span class="text-neutral-300">|</span>
        <span>Course Scores: <strong>{{ totalCoursePoints.toFixed(1) }}</strong> pts</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useGradeStore } from '@/stores/grade.store'
import { useAttendanceStore } from '@/stores/attendance.store'

const authStore = useAuthStore()
const gradeStore = useGradeStore()
const attendanceStore = useAttendanceStore()

const expandedCourses = ref<number[]>([])

onMounted(async () => {
  if (authStore.user?.id) {
    attendanceStore.fetchStudentAttendance()
    gradeStore.fetchGrades()
  }
})

// Process grades into courses
const groupedGrades = computed(() => {
  const coursesMap = new Map()

  gradeStore.grades.forEach(grade => {
    const courseId = grade.course?.id
    if (!courseId) return

    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        id: courseId,
        code: `CRS-${courseId}00`, // Using dummy code since code isn't in API currently
        name: grade.course?.name || 'Unknown Course',
        components: [],
        totalPts: 0,
        totalWeight: 0
      })
    }

    const course = coursesMap.get(courseId)
    const weight = Number(grade.course_component?.weight || 0)
    const normalizedScore = Number(grade.normalized_score || grade.raw_score || 0)
    const pts = (normalizedScore / 100) * weight

    course.components.push({
      id: grade.id,
      type: grade.course_component?.type || 'Assessment',
      weight: weight,
      score: normalizedScore,
      pts: pts
    })

    course.totalPts += pts
    course.totalWeight += weight
  })

  // Compute QPA for each course
  return Array.from(coursesMap.values()).map(course => {
    // QPA max is 4.0
    const qpa = course.totalWeight > 0 ? (course.totalPts / course.totalWeight) * 4.0 : 0
    return { ...course, qpa }
  })
})

const totalCoursePoints = computed(() => {
  return groupedGrades.value.reduce((sum, course) => sum + course.totalPts, 0)
})

const ledgerBalance = computed(() => {
  return attendanceStore.studentAttendance?.ledger_balance || 0
})

const grandTotal = computed(() => {
  return ledgerBalance.value + totalCoursePoints.value
})

const academicStanding = computed(() => {
  const total = grandTotal.value
  if (total >= 400) return 'High Distinction'
  if (total >= 300) return 'Distinction'
  if (total >= 200) return 'Credit'
  return 'Pass'
})

const toggleCourse = (id: number) => {
  const idx = expandedCourses.value.indexOf(id)
  if (idx === -1) expandedCourses.value.push(id)
  else expandedCourses.value.splice(idx, 1)
}

const formatComponentType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const formatQPA = (qpa: number) => {
  return qpa.toFixed(1)
}
</script>
