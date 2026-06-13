<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'
import { useScanner } from '@/composables/useScanner'
import { getActiveSessions, scanSessionQR } from '@/api/modules/attendance.api'
import api from '@/api/axios'

const authStore = useAuthStore()
const cohortStore = useCohortStore()

const {
  initScanner,
  isScanning,
  errorMsg,
  successMsg
} = useScanner('reader')

const isLoading = ref(true)

// Scanner State
const activeSessionId = ref<number | null>(null)

// Manual Input State
const manualStudentId = ref('')
const isSubmittingManual = ref(false)
const manualError = ref('')
const manualSuccess = ref('')

// Roster State
const roster = ref<any[]>([])

interface MappedSession {
  id?: number
  session_date: string
  start_time: string
  end_time: string
  type: string
  cohort_name: string
}

// Upcoming & History State
const upcomingSessions = ref<MappedSession[]>([])
const pastSessions = ref<MappedSession[]>([])

const hasNoSessions = computed(() =>
  !isLoading.value &&
  !activeSessionId.value &&
  upcomingSessions.value.length === 0 &&
  pastSessions.value.length === 0
)

const fetchRoster = async () => {
  if (!activeSessionId.value) return
  try {
    const res = await api.get(`/v1/sessions/${activeSessionId.value}/attendance`)
    roster.value = res.data.data?.records || []
  } catch (err) {
    console.error("Failed to load session roster", err)
  }
}

const submitManualAttendance = async () => {
  if (!manualStudentId.value || !activeSessionId.value) return
  
  isSubmittingManual.value = true
  manualError.value = ''
  manualSuccess.value = ''
  
  try {
    await scanSessionQR({
      session_id: activeSessionId.value,
      student_id: parseInt(manualStudentId.value)
    })
    
    manualSuccess.value = 'Attendance recorded manually'
    manualStudentId.value = ''
    await fetchRoster()
    
    setTimeout(() => { manualSuccess.value = '' }, 3000)
  } catch (err: any) {
    manualError.value = err.response?.data?.message || 'Failed to record attendance manually'
    setTimeout(() => { manualError.value = '' }, 3000)
  } finally {
    isSubmittingManual.value = false
  }
}

const markAbsent = async (studentId: number) => {
  if (!activeSessionId.value) return
  try {
    await api.post(`/v1/sessions/${activeSessionId.value}/mark-absent`, {
      student_ids: [studentId]
    })
    await fetchRoster()
  } catch (e) {
    console.error('Failed to mark absent', e)
  }
}

onMounted(async () => {
  try {
    // 1. Check for Active Sessions
    const activeRes = await getActiveSessions()
    const active = activeRes.data.data || []
    
    if (active.length > 0 && active[0]?.id) {
      activeSessionId.value = active[0].id
      await fetchRoster()
      
      // Auto-refresh roster every 30 seconds
      setInterval(fetchRoster, 30000)
    }

    // 2. Fetch Instructor Engagements for Upcoming & History
    const instructorId = authStore.user?.id
    if (instructorId) {
      const engRes = await api.get(`/v1/engagements?instructor_id=${instructorId}`)
      const engagements = engRes.data.data || []
      
      const now = new Date()
      const todayISO = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0] // H:i:s

      interface EngagementApi { type?: string; cohorts?: Array<{ name?: string }>; daily_start_time?: string; daily_end_time?: string; sessions?: Array<{ session_date?: string; start_time?: string; end_time?: string }> }
      const allSessions: MappedSession[] = []

      engagements.forEach((eng: any) => {
        (eng.sessions ?? []).forEach((sess: any) => {
          allSessions.push({
            ...sess,
            type: eng.type,
            cohort_name: eng.cohorts?.[0]?.name || 'Unknown Cohort',
            start_time: sess.start_time || eng.daily_start_time || '09:00:00',
            end_time: sess.end_time || eng.daily_end_time || '12:00:00'
          })
        })
      })

      // Sort chronological
      allSessions.sort((a, b) => {
        const dateA = a.session_date || '';
        const dateB = b.session_date || '';
        const dateAStr = dateA.split('T')[0] || '';
        const dateBStr = dateB.split('T')[0] || '';
        if (dateAStr !== dateBStr) return dateAStr.localeCompare(dateBStr);
        const timeA = a.start_time || '';
        const timeB = b.start_time || '';
        return timeA.localeCompare(timeB);
      })

      // Separate into Upcoming and Past
      allSessions.forEach((sess: any) => {
        const sessDate = sess.session_date?.split('T')[0] || ''
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
    <div v-else-if="activeSessionId" class="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto w-full items-start">
      
      <!-- Left Column: Scanner & Controls -->
      <div class="lg:col-span-3 flex flex-col gap-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <!-- Top banner indicating active session -->
          <div class="bg-indigo-50 border-b border-indigo-100 px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="relative flex h-3.5 w-3.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <span class="text-base font-bold text-indigo-900 tracking-tight">Live Session Active</span>
            </div>
            <div class="text-sm font-bold text-indigo-700 bg-white px-3 py-1 rounded-md border border-indigo-200 shadow-sm">
                Session ID: {{ activeSessionId }}
            </div>
          </div>

          <!-- Manual Scan Fallback -->
          <div class="p-5 bg-slate-50 border-b border-slate-200">
            <label class="block text-sm font-bold text-slate-700 mb-2">Manual Attendance Entry</label>
            <form @submit.prevent="submitManualAttendance" class="flex gap-3">
              <input 
                v-model="manualStudentId" 
                type="text" 
                placeholder="Enter Student ID" 
                class="flex-1 bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
                :disabled="isSubmittingManual"
              />
              <button 
                type="submit" 
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                :disabled="isSubmittingManual || !manualStudentId"
              >
                <span v-if="isSubmittingManual">Recording...</span>
                <span v-else>Submit</span>
              </button>
            </form>
            <div v-if="manualError" class="mt-2.5 text-sm font-medium text-rose-600 flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ manualError }}</div>
            <div v-if="manualSuccess" class="mt-2.5 text-sm font-medium text-emerald-600 flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>{{ manualSuccess }}</div>
          </div>

          <!-- Video Feed Area -->
          <div class="w-full bg-slate-900 relative overflow-hidden flex items-center justify-center min-h-[400px]">
            <div id="reader" class="w-full h-full text-white [&>img]:hidden [&>div]:border-none"></div>

            <!-- Success Overlay -->
            <div v-if="successMsg" class="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white z-20 transition-all duration-300 backdrop-blur-sm">
              <div class="bg-white/20 p-4 rounded-full mb-4">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-3xl font-black mb-2 tracking-tight">Success!</h2>
              <p class="text-lg text-emerald-50 font-medium">{{ successMsg }}</p>
            </div>

            <!-- Error Overlay -->
            <div v-if="errorMsg" class="absolute inset-0 bg-rose-500/95 flex flex-col items-center justify-center text-white z-20 transition-all duration-300 p-6 text-center backdrop-blur-sm">
              <div class="bg-white/20 p-4 rounded-full mb-4">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 class="text-3xl font-black mb-2 tracking-tight">Scan Failed</h2>
              <p class="text-lg text-rose-50 font-medium">{{ errorMsg }}</p>
            </div>
          </div>
          
          <!-- Footer Info -->
          <div class="p-5 bg-slate-50 border-t border-slate-200">
            <div v-if="isScanning" class="text-center">
              <p class="text-sm text-slate-800 font-bold flex items-center justify-center gap-2 mb-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Camera Active
              </p>
              <p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Show student badge to record attendance. If the screen glare makes it hard to scan, tilt the phone slightly.
              </p>
            </div>
            <div v-else class="text-center">
              <p class="text-sm text-slate-400 font-medium flex items-center justify-center gap-2">
                <svg class="w-4 h-4 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing scan...
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Live Roster Table -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[800px]">
          <div class="px-5 py-4 bg-slate-50 flex items-center justify-between border-b border-slate-200 rounded-t-2xl">
            <div>
              <h3 class="font-bold text-slate-800 tracking-tight text-lg">Live Roster</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ roster.length }} Students Enrolled</p>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2">
            <div v-if="roster.length === 0" class="flex flex-col items-center justify-center h-48 text-slate-400">
              <svg class="w-10 h-10 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <p class="text-sm font-medium">Loading roster data...</p>
            </div>

            <div class="space-y-2">
              <div v-for="entry in roster" :key="entry.student.id" class="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 shrink-0">
                    {{ entry.student.name.substring(0,2).toUpperCase() }}
                  </div>
                  <div>
                    <button @click="cohortStore.openStudentProfile(entry.student.id)" class="text-sm font-bold text-slate-800 hover:text-indigo-600 text-left transition-colors">
                      {{ entry.student.name }}
                    </button>
                    <div class="text-xs text-slate-400 font-medium mt-0.5">ID: {{ entry.student.id }}</div>
                  </div>
                </div>
                
                <div class="flex flex-col items-end gap-2">
                  <span v-if="entry.record && entry.record.status === 'present'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Present
                  </span>
                  <span v-else-if="entry.record && entry.record.status === 'absent'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Absent
                  </span>
                  <span v-else-if="entry.excuse && entry.excuse.status === 'approved'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Excused
                  </span>
                  <span v-else-if="entry.excuse && entry.excuse.status === 'requested'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending
                  </span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    Waiting
                  </span>

                  <button 
                    v-if="!entry.record && !entry.excuse"
                    @click="markAbsent(entry.student.id)" 
                    class="text-[11px] bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-bold transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-wide"
                  >
                    Mark Absent
                  </button>
                  <span v-else-if="entry.record?.arrived_at" class="text-[10px] font-bold text-slate-400">
                    {{ formatTime(entry.record.arrived_at.split('T')[1].substring(0,5)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
          
            <div v-if="upcomingSessions.length > 0 && upcomingSessions[0]" class="p-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-700">
                {{ upcomingSessions[0].type.replace('_', ' ') }}
              </span>
            </div>
            
            <h3 class="text-xl font-bold text-slate-800 mb-4">{{ upcomingSessions[0].cohort_name }}</h3>
            
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <div v-if="upcomingSessions[0]">
                  <div class="text-sm font-medium text-slate-800">{{ formatFriendlyDate(upcomingSessions[0].session_date) }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ formatTime(upcomingSessions[0].start_time) }} - {{ formatTime(upcomingSessions[0].end_time) }}</div>
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
