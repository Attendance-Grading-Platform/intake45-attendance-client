<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  getInstructorDashboard,
  type InstructorDashboardPayload,
} from '@/api/modules/dashboard.api'
import { getActiveSessions } from '@/api/modules/attendance.api'

ChartJS.register(ArcElement, Tooltip, Legend)

const router = useRouter()

const isLoading      = ref(true)
const error          = ref<string | null>(null)
const dashboard      = ref<InstructorDashboardPayload | null>(null)
const activeSessions = ref<{ id: number; start_time?: string; end_time?: string; engagement?: { type?: string } }[]>([])

onMounted(async () => {
  try {
    const [dashRes, sessionsRes] = await Promise.all([
      getInstructorDashboard(),
      getActiveSessions(),
    ])
    dashboard.value      = dashRes.data.data
    activeSessions.value = sessionsRes.data.data
  } catch (err: unknown) {
    const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = axiosMsg ?? 'Failed to load dashboard data. Please try again.'
  } finally {
    isLoading.value = false
  }
})

const hasActiveSession = computed(() => activeSessions.value.length > 0)
const currentSession   = computed(() => activeSessions.value[0] ?? null)

const chartData = computed(() => {
  const dist = dashboard.value?.grade_distribution
  if (!dist) return null
  return {
    labels: Object.keys(dist),
    datasets: [{
      data: Object.values(dist),
      backgroundColor: ['#059669', '#0891b2', '#2563eb', '#d97706', '#dc2626'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { family: 'DM Sans, sans-serif', size: 12 } },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { family: 'DM Sans, sans-serif', size: 13 },
      bodyFont:  { family: 'DM Sans, sans-serif', size: 12 },
      padding: 10,
      cornerRadius: 6,
    },
  },
}

function launchScanner() {
  router.push('/instructor/attendance')
}
</script>

<template>
  <div class="p-6 min-h-[calc(100vh-56px)]">

    <div class="mb-8">
      <h3 class="font-sans text-label uppercase tracking-widest text-neutral-500 mb-1">Instructor Portal</h3>
      <h1 class="font-serif text-h1 text-neutral-900">Dashboard</h1>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 4" :key="i"
        :class="['rounded-card border border-neutral-300 bg-neutral-0 p-6 animate-pulse', i === 1 ? 'lg:col-span-2 min-h-[200px]' : 'min-h-[180px]']"
      >
        <div class="h-4 bg-neutral-200 rounded w-1/3 mb-4" />
        <div class="h-8 bg-neutral-200 rounded w-1/2 mb-3" />
        <div class="h-4 bg-neutral-200 rounded w-2/3" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-card border border-danger bg-danger-light p-8 text-center max-w-lg mx-auto">
      <p class="font-sans text-base text-danger font-medium mb-2">Something went wrong</p>
      <p class="font-sans text-sm text-neutral-600">{{ error }}</p>
    </div>

    <!-- Bento Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <!-- Widget 1 — Scanner Quick-Launch -->
      <div
        id="widget-scanner"
        :class="[
          'lg:col-span-2 rounded-card border p-6 transition-all duration-slow',
          hasActiveSession
            ? 'border-success bg-gradient-to-br from-success-light to-emerald-50 hover:shadow-md'
            : 'border-neutral-300 bg-neutral-100'
        ]"
      >
        <template v-if="hasActiveSession">
          <div class="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
                <span class="font-sans text-label uppercase tracking-widest text-success font-medium">Live Session</span>
              </div>
              <h2 class="font-serif text-h2 text-neutral-900 mb-2">Session #{{ currentSession?.id }}</h2>
              <p class="font-sans text-base text-neutral-600">
                {{ currentSession?.start_time?.slice(0, 5) }} — {{ currentSession?.end_time?.slice(0, 5) }}
                <span v-if="currentSession?.engagement?.type" class="ml-2 px-2 py-0.5 rounded-badge text-sm font-medium bg-success/10 text-success">
                  {{ currentSession.engagement.type }}
                </span>
              </p>
            </div>
            <button
              id="btn-launch-scanner"
              @click="launchScanner"
              class="h-btn px-6 rounded-btn bg-success text-white font-sans text-base font-medium flex items-center gap-2 hover:brightness-110 active:scale-[0.97] transition-all duration-fast cursor-pointer shadow-sm"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
              </svg>
              Launch QR Scanner
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-3 opacity-60">
            <svg class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <div>
              <p class="font-sans text-h3 text-neutral-500">No Active Sessions</p>
              <p class="font-sans text-sm text-neutral-400">Scanner will activate when a session is live.</p>
            </div>
          </div>
        </template>
      </div>

      <!-- Widget 2 — Delivered Hours -->
      <div id="widget-delivered-hours" class="rounded-card border border-neutral-300 bg-neutral-0 p-6 flex flex-col justify-between">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-10 w-10 rounded-full bg-info-light flex items-center justify-center">
            <svg class="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span class="font-sans text-label uppercase tracking-widest text-neutral-500">Hours Delivered</span>
        </div>
        <div>
          <p class="font-sans text-data-xl text-neutral-900 leading-none mb-1">{{ dashboard?.delivered_hours ?? 0 }}</p>
          <p class="font-sans text-sm text-neutral-500">Total this semester</p>
        </div>
      </div>

      <!-- Widget 3 — Assigned Lab Groups -->
      <div id="widget-lab-groups" class="lg:col-span-2 rounded-card border border-neutral-300 bg-neutral-0 p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="h-10 w-10 rounded-full bg-warning-light flex items-center justify-center">
            <svg class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <h3 class="font-sans text-h3 text-neutral-900">Assigned Lab Groups</h3>
        </div>
        <div v-if="dashboard?.lab_groups?.length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-neutral-300">
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500">Group</th>
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500">Track</th>
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="group in dashboard.lab_groups"
                :key="group.id"
                class="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors duration-fast"
              >
                <td class="py-4 px-4 font-sans text-base text-neutral-800 font-medium">{{ group.name }}</td>
                <td class="py-4 px-4 font-sans text-sm text-neutral-600">{{ group.track_name }}</td>
                <td class="py-4 px-4 text-right">
                  <router-link
                    :to="`/instructor/grades?group_id=${group.id}`"
                    class="inline-flex items-center gap-1.5 h-btn-sm px-4 rounded-btn bg-neutral-900 text-white font-sans text-sm font-medium hover:bg-neutral-800 active:scale-[0.97] transition-all duration-fast"
                  >
                    Grade Submissions
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="py-8 text-center">
          <p class="font-sans text-sm text-neutral-400">No lab groups assigned to you yet.</p>
        </div>
      </div>

      <!-- Widget 4 — Grade Distribution Chart -->
      <div id="widget-grade-chart" class="rounded-card border border-neutral-300 bg-neutral-0 p-6 flex flex-col">
        <div class="flex items-center gap-3 mb-5">
          <div class="h-10 w-10 rounded-full bg-danger-light flex items-center justify-center">
            <svg class="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
          </div>
          <h3 class="font-sans text-h3 text-neutral-900">Grade Distribution</h3>
        </div>
        <div v-if="chartData" class="flex-1 flex items-center justify-center min-h-[220px]">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="flex-1 flex items-center justify-center">
          <p class="font-sans text-sm text-neutral-400">No grade data available.</p>
        </div>
      </div>

    </div>
  </div>
</template>
