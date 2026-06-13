<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useScanner } from '@/composables/useScanner'
import { getActiveSessions } from '@/api/modules/attendance.api'
import api from '@/api/axios'

const authStore = useAuthStore()

const {
  initScanner,
  isScanning,
  errorMsg,
  successMsg
} = useScanner('reader')

const isLoading = ref(true)

// Scanner State
const activeSessionId = ref<number | null>(null)

interface MappedSession { id?: number; session_date: string; start_time: string; end_time: string; type: string; cohort_name: string }

// Upcoming & History State
const upcomingSessions = ref<MappedSession[]>([])
const pastSessions = ref<MappedSession[]>([])

const hasNoSessions = computed(() =>
  !isLoading.value &&
  !activeSessionId.value &&
  upcomingSessions.value.length === 0 &&
  pastSessions.value.length === 0
)

onMounted(async () => {
  try {
    // 1. Check for Active Sessions
    const activeRes = await getActiveSessions()
    const active = activeRes.data.data || []
    
    if (active.length > 0 && active[0]?.id) {
      activeSessionId.value = active[0].id
    }

    // 2. Fetch Instructor Engagements for Upcoming & History
    const instructorId = authStore.user?.id
    if (instructorId) {
      const engRes = await api.get(`/v1/engagements?instructor_id=${instructorId}`)
      const engagements = engRes.data.data || []
      
      const now = new Date()
      const todayISO = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0] // H:i:s

      interface EngagementApi { type?: string; cohorts?: Array<{ name?: string }>; daily_start_time?: string; daily_end_time?: string; sessions?: Array<{ id?: number; session_date?: string; start_time?: string; end_time?: string }> }
      const allSessions: MappedSession[] = []

      engagements.forEach((eng: EngagementApi) => {
        (eng.sessions ?? []).forEach((sess) => {
          allSessions.push({
            ...sess,
            id: sess.id,
            session_date: sess.session_date ?? '',
            type: eng.type ?? 'lecture',
            cohort_name: eng.cohorts?.[0]?.name || 'Unknown Cohort',
            start_time: sess.start_time || eng.daily_start_time || '09:00:00',
            end_time: sess.end_time || eng.daily_end_time || '12:00:00'
          })
        })
      })

      // Sort chronological
      allSessions.sort((a, b) => {
        const dateA = a.session_date.split('T')[0] || ''
        const dateB = b.session_date.split('T')[0] || ''
        if (dateA !== dateB) return dateA.localeCompare(dateB)
        return a.start_time.localeCompare(b.start_time)
      })

      // Separate into Upcoming and Past
      allSessions.forEach(sess => {
        const sessDate = sess.session_date.split('T')[0] || ''
        const sessEndTime = sess.end_time || '23:59:59'
        
        // It's past if the date is before today, OR if it's today but the end_time has passed
        const isPast = sessDate < (todayISO || '') || (sessDate === todayISO && sessEndTime < (currentTime || ''))
        
        // We exclude the currently active session from upcoming/past arrays
        if (activeSessionId.value && sess.id === activeSessionId.value) {
            return
        }

        if (isPast) {
          pastSessions.value.push(sess)
        } else {
          upcomingSessions.value.push(sess)
        }
      })
      
      // Reverse past sessions so most recent is first
      pastSessions.value.reverse()
    }
  } catch (err) {
    console.error('Failed to load dashboard data', err)
  } finally {
    isLoading.value = false
    
    // Initialize scanner after DOM updates from isLoading -> false
    if (activeSessionId.value) {
      await nextTick()
      initScanner(activeSessionId.value)
    }
  }
})

// Formatting helpers
function formatFriendlyDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  return `${h}:${m}`
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto flex flex-col gap-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Attendance Dashboard</h1>
      <p class="text-slate-500 mt-1">Manage and record student attendance for your scheduled sessions.</p>
    </div>

    <!-- State: Loading -->
    <div v-if="isLoading" class="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <h3 class="text-lg font-bold text-slate-800 mb-1">Loading Dashboard</h3>
      <p class="text-slate-500">Checking your schedule...</p>
    </div>

    <!-- State: Scanner Active -->
    <div v-else-if="activeSessionId" class="relative bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto w-full">
      
      <!-- Top banner indicating active session -->
      <div class="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span class="text-sm font-bold text-indigo-900">Live Session Active</span>
        </div>
        <div class="text-xs font-semibold text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200">
            Session ID: {{ activeSessionId }}
        </div>
      </div>

      <!-- Video Feed Area -->
      <div class="aspect-square md:aspect-video w-full bg-slate-900 relative">
        <div id="reader" class="w-full h-full text-white [&>img]:hidden [&>div]:border-none"></div>

        <!-- Success Overlay -->
        <div v-if="successMsg" class="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-white z-10 transition-opacity duration-300">
          <svg class="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-3xl font-bold mb-2">Success!</h2>
          <p class="text-lg text-emerald-50 font-medium">{{ successMsg }}</p>
        </div>

        <!-- Error Overlay -->
        <div v-if="errorMsg" class="absolute inset-0 bg-rose-500/90 flex flex-col items-center justify-center text-white z-10 transition-opacity duration-300 p-6 text-center">
          <svg class="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-3xl font-bold mb-2">Scan Failed</h2>
          <p class="text-lg text-rose-50 font-medium">{{ errorMsg }}</p>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 text-center">
        <div v-if="isScanning">
          <p class="text-sm text-slate-800 font-bold flex items-center justify-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Camera Active - Show student badge to record attendance
          </p>
          <p class="text-xs text-slate-500">
            <strong>Tip:</strong> If the screen glare makes it hard to scan, tilt the phone slightly or move it to the edge of the camera view. The scanner reads the entire frame!
          </p>
        </div>
        <div v-else>
          <p class="text-sm text-slate-400 font-medium">Processing scan... Please wait.</p>
        </div>
      </div>
    </div>

    <!-- State: No Sessions Assigned -->
    <div v-else-if="hasNoSessions" class="bg-white rounded-xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
      <div class="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center mb-5">
        <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-bold text-slate-800 mb-2">No Scheduled Sessions Found</h3>
      <p class="text-slate-500 text-sm max-w-sm">
        You have no upcoming or past sessions assigned for this intake. The QR scanner will appear here automatically when a session is live.
      </p>
    </div>

    <!-- State: Waiting Mode (No Active Session) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column: Upcoming Session -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-8">
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-800">Next Upcoming Session</h2>
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          
          <div v-if="upcomingSessions.length === 0" class="p-8 text-center flex flex-col items-center">
            <div class="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 class="text-slate-800 font-bold mb-1">Schedule Complete</h3>
            <p class="text-slate-500 text-sm">You have no upcoming sessions assigned for this intake.</p>
          </div>
          
          <div v-else class="p-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-700">
                {{ upcomingSessions[0]?.type.replace('_', ' ') }}
              </span>
            </div>
            
            <h3 class="text-xl font-bold text-slate-800 mb-4">{{ upcomingSessions[0]?.cohort_name }}</h3>
            
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <div>
                  <div class="text-sm font-medium text-slate-800">{{ upcomingSessions[0]?.session_date ? formatFriendlyDate(upcomingSessions[0].session_date) : '' }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ upcomingSessions[0]?.start_time ? formatTime(upcomingSessions[0].start_time) : '' }} - {{ upcomingSessions[0]?.end_time ? formatTime(upcomingSessions[0].end_time) : '' }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Bottom hint -->
          <div v-if="upcomingSessions.length > 0" class="bg-amber-50 px-6 py-3 border-t border-amber-100 flex items-start gap-3">
            <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-xs text-amber-700">The QR scanner will automatically activate here when this session's time window begins.</p>
          </div>
        </div>
      </div>

      <!-- Right Column: History of Sessions -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 class="text-lg font-bold text-slate-800">History of Sessions</h2>
          </div>
          
          <div v-if="pastSessions.length === 0" class="p-8 text-center text-slate-500">
            No past sessions found in your history.
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3 font-semibold">Date</th>
                  <th class="px-6 py-3 font-semibold">Time</th>
                  <th class="px-6 py-3 font-semibold">Type</th>
                  <th class="px-6 py-3 font-semibold">Cohort</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="sess in pastSessions" :key="sess.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                    {{ formatFriendlyDate(sess.session_date) }}
                  </td>
                  <td class="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {{ formatTime(sess.start_time) }} - {{ formatTime(sess.end_time) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                      {{ sess.type.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {{ sess.cohort_name }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* Clean up default html5-qrcode styling */
#reader__dashboard_section_csr span {
  display: none !important;
}
#reader__dashboard_section_swaplink {
  color: white !important;
  text-decoration: underline;
  margin-top: 10px;
  display: inline-block;
}
#reader button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
#reader select {
  padding: 8px;
  border-radius: 4px;
  margin-right: 10px;
  color: black;
}
</style>
