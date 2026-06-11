<template>
  <div class="space-y-8 max-w-content mx-auto pb-10">
    <header>
      <p class="text-label text-neutral-500 mb-2">WELCOME BACK</p>
      <h1 class="font-serif text-h1 text-neutral-800">{{ authStore.user?.name || 'Student' }}</h1>
      <hr class="border-neutral-300 mt-4" />
    </header>

    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- Left: Announcements -->
      <div class="w-full lg:w-[65%] space-y-6">
        <h3 class="text-label text-brand-red font-semibold flex justify-between items-center">
          <span>MY ANNOUNCEMENTS</span>
          <router-link to="/student/announcements" class="text-brand-red hover:underline underline-offset-4 font-normal">VIEW ALL</router-link>
        </h3>
        
        <div v-if="announcementsStore.isLoading" class="text-neutral-600">
          Loading announcements...
        </div>
        
        <div v-else-if="announcementsStore.announcements.length === 0" class="bg-neutral-0 border border-neutral-300 rounded-card p-6 text-center text-neutral-600">
          <h3 class="font-serif text-[20px] text-neutral-800 mb-2">No announcements</h3>
          <p class="text-base">You're all caught up!</p>
        </div>
        
        <div v-else class="space-y-6">
          <div v-for="announcement in displayedAnnouncements" :key="announcement.id" class="bg-neutral-0 border border-neutral-300 rounded-card p-6 flex flex-col gap-4 items-start hover:shadow-drawer transition-shadow duration-slow">
             <div class="w-full flex flex-col h-full justify-between">
                 <div>
                   <p class="text-label text-neutral-500 mb-2">CAMPUS NEWS • {{ formatDate(announcement.published_at) }}</p>
                   <h2 class="font-serif text-h2 text-brand-red mb-3 leading-tight">{{ announcement.title }}</h2>
                   <p class="text-base text-neutral-600 line-clamp-3 mb-4">{{ announcement.body }}</p>
                 </div>
                 <router-link to="/student/announcements" class="text-base font-bold text-brand-red hover:underline underline-offset-4 flex items-center mt-2 group">
                   Read more <span class="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                 </router-link>
             </div>
          </div>
        </div>
      </div>

      <!-- Right: Stats -->
      <div class="w-full lg:w-[35%] space-y-6">
        <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
          <h3 class="text-label text-neutral-500 mb-6">ATTENDANCE LEDGER</h3>
          
          <div v-if="attendanceStore.isLoading" class="text-neutral-600">
            Loading ledger...
          </div>
          <div v-else-if="attendanceStore.studentAttendance">
            <div class="flex items-baseline mb-4">
              <span class="font-serif text-[48px] leading-none" :class="ledgerColorClass">{{ ledgerBalance }}</span>
              <span class="text-md text-neutral-600 ml-2">/ 250 points</span>
            </div>
            
            <p class="text-sm text-neutral-600 mb-2">{{ ledgerPercentage }}% completion rate</p>
            
            <!-- Progress Bar -->
            <div class="w-full h-[6px] bg-neutral-200 rounded-full overflow-hidden mb-8">
              <div class="h-full rounded-full transition-all duration-1000 ease-out" :class="ledgerBgClass" :style="{ width: `${ledgerPercentage}%` }"></div>
            </div>
            
            <div class="flex justify-between border-t border-neutral-300 pt-5">
              <div>
                <p class="text-label text-neutral-500 mb-2">STATUS</p>
                <p class="text-base font-medium text-neutral-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="attendanceStore.studentAttendance.is_at_risk ? 'bg-warning' : 'bg-success'"></span>
                  {{ attendanceStore.studentAttendance.is_at_risk ? 'At Risk' : 'Compliant' }}
                </p>
              </div>
              <div class="text-right">
                 <p class="text-label text-neutral-500 mb-2">REQUIRED</p>
                 <p class="text-base font-medium text-neutral-800">200 points (80%)</p>
              </div>
            </div>
          </div>
          <div v-else class="text-neutral-600">
            Ledger unavailable.
          </div>
        </div>
        
        <!-- My Progress -->
        <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
          <div class="flex justify-between items-center mb-6 border-b border-neutral-300 pb-4">
            <h3 class="text-label text-neutral-500">MY PROGRESS</h3>
          </div>
          
          <div v-if="gradeStore.isLoading" class="text-neutral-600">
            Loading progress...
          </div>
          <div v-else-if="gradeStore.grades.length === 0" class="text-neutral-600">
            No grades available yet.
          </div>
          <div v-else class="h-[200px] w-full">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'
import { useAnnouncementsStore } from '@/stores/announcements.store'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useGradeStore } from '@/stores/grade.store'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const authStore = useAuthStore()
const cohortStore = useCohortStore()
const announcementsStore = useAnnouncementsStore()
const attendanceStore = useAttendanceStore()
const gradeStore = useGradeStore()

const ledgerBalance = computed(() => {
    return attendanceStore.studentAttendance?.ledger_balance || 0
})

const ledgerPercentage = computed(() => {
    return Math.max(0, Math.min(100, Math.round((ledgerBalance.value / 250) * 100)))
})

const ledgerColorClass = computed(() => {
    if (ledgerBalance.value >= 200) return 'text-brand-red'
    if (ledgerBalance.value >= 150) return 'text-warning'
    return 'text-danger'
})

const ledgerBgClass = computed(() => {
    if (ledgerBalance.value >= 200) return 'bg-brand-red'
    if (ledgerBalance.value >= 150) return 'bg-warning'
    return 'bg-danger'
})

const displayedAnnouncements = computed(() => {
    return announcementsStore.announcements.slice(0, 2)
})

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'OCT 12'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

const chartData = computed(() => {
    const sortedGrades = [...gradeStore.grades].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    
    return {
        labels: sortedGrades.map((g, idx) => g.course?.name || `Milestone ${idx + 1}`),
        datasets: [
            {
                label: 'Normalized Score',
                backgroundColor: '#940002',
                borderColor: '#940002',
                data: sortedGrades.map(g => g.normalized_score || g.raw_score),
                tension: 0.4
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            max: 100
        }
    },
    plugins: {
        legend: {
            display: false
        }
    }
}

onMounted(async () => {
    if (authStore.user?.id) {
        attendanceStore.fetchStudentAttendance(authStore.user.id)
        gradeStore.fetchGrades()
    }
    
    await cohortStore.fetchCohorts()
    // Find active cohort to fetch announcements
    if (cohortStore.cohorts.length > 0) {
        const activeCohort = cohortStore.cohorts.find(c => c.status === 'active') || cohortStore.cohorts[0]
        if (activeCohort) {
            announcementsStore.fetchCohortAnnouncements(activeCohort.id)
        }
    }
})
</script>
