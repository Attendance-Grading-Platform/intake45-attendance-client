<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEngagementStore } from '@/stores/engagement.store'

const router = useRouter()
const engagementStore = useEngagementStore()

// We'll manage a 'currentWeekStart' to paginate through weeks
const currentWeekStart = ref(getStartOfWeek(new Date()))

onMounted(async () => {
  await engagementStore.fetchAll()
})

// Helper to get the Sunday of the given date's week
function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function nextWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
}

function prevWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
}

// Generate the 7 days of the currently viewed week
const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart.value)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
})

// Format helpers
function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getDayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

function formatISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatFriendlyDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Get sessions for a specific date
function getSessionsForDate(date: Date) {
  const isoDate = formatISODate(date)
  return engagementStore.allSessions.filter(s => s.session_date.split('T')[0] === isoDate)
}

// Sidebar: Upcoming Sessions
const upcomingSessions = computed(() => {
  const todayISO = formatISODate(new Date())
  return engagementStore.allSessions
    .filter(s => s.session_date >= todayISO)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(0, 5) // Show top 5
})

// Setup time grid
const calendarStartHour = 8
const calendarEndHour = 20
const totalHours = calendarEndHour - calendarStartHour

const timeSlots = computed(() => {
  const slots = []
  for (let i = calendarStartHour; i <= calendarEndHour; i++) {
    slots.push(i)
  }
  return slots
})

function formatHour(hour: number) {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'AM' : 'PM'
  return `${h}:00 ${ampm}`
}

function parseTime(timeStr: string | null | undefined, defaultTime: string) {
  if (!timeStr) timeStr = defaultTime
  const parts = timeStr.split(':')
  const hours = Number(parts[0] || 0)
  const minutes = Number(parts[1] || 0)
  return hours + (minutes / 60)
}

function getSessionPosition(session: any) {
  const start = parseTime(session.start_time || session.parentEngagement?.daily_start_time, '09:00:00')
  const end = parseTime(session.end_time || session.parentEngagement?.daily_end_time, '12:00:00')
  
  const visualStart = Math.max(calendarStartHour, start)
  const visualEnd = Math.min(calendarEndHour, end)
  
  if (visualEnd <= visualStart) return { display: 'none' }
  
  const topPercentage = ((visualStart - calendarStartHour) / totalHours) * 100
  const heightPercentage = ((visualEnd - visualStart) / totalHours) * 100
  
  return {
    top: `${topPercentage}%`,
    height: `${heightPercentage}%`,
    position: 'absolute' as const,
    left: '4px',
    right: '4px',
    zIndex: 10
  }
}

function formatTimeRange(session: any) {
  const startStr = session.start_time || session.parentEngagement?.daily_start_time || '09:00:00'
  const endStr = session.end_time || session.parentEngagement?.daily_end_time || '12:00:00'
  
  const formatTime = (t: string) => {
    const [h, m] = t.split(':')
    return `${h}:${m}`
  }
  return `${formatTime(startStr)} - ${formatTime(endStr)}`
}

// Color coding based on engagement type
function getCardStyle(type: string) {
  switch (type) {
    case 'lecture':
      return 'bg-rose-50/90 border-rose-200 text-rose-800'
    case 'lab':
      return 'bg-indigo-50/90 border-indigo-200 text-indigo-800'
    case 'business':
      return 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
    default:
      return 'bg-slate-50/90 border-slate-200 text-slate-800'
  }
}

function getBadgeStyle(type: string) {
  switch (type) {
    case 'lecture':
      return 'bg-rose-500'
    case 'lab':
      return 'bg-indigo-500'
    case 'business':
      return 'bg-emerald-500'
    default:
      return 'bg-slate-500'
  }
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto flex flex-col gap-6">
    
    <!-- Main Calendar Area -->
    <div class="flex-1 bg-white shadow-lg rounded-sm border border-slate-200 p-4 lg:p-6 flex flex-col min-w-0">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Engagements & Sessions</h1>
          <div class="flex items-center mt-2 space-x-2">
            <button @click="prevWeek" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shadow-sm transition-colors flex items-center justify-center" aria-label="Previous Week">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class="font-bold text-slate-800 min-w-[140px] text-center">{{ formatMonthYear(currentWeekStart) }}</span>
            <button @click="nextWeek" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shadow-sm transition-colors flex items-center justify-center" aria-label="Next Week">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <router-link :to="{ name: 'track-admin-engagement-create' }" class="btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Add engagement
        </router-link>
      </div>

      <!-- Loader -->
      <div v-if="engagementStore.isLoading" class="flex-1 flex justify-center items-center py-20">
        <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>

      <!-- Calendar Grid -->
      <div v-else class="flex-1 bg-white rounded-lg border border-slate-200 flex overflow-x-auto min-h-[600px]">
        
        <!-- Time Axis -->
        <div class="w-16 lg:w-20 shrink-0 border-r border-slate-200 flex flex-col relative" style="min-height: 800px;">
          <!-- Top empty header space for day names -->
          <div class="h-16 lg:h-20 border-b border-slate-200 bg-slate-50 sticky top-0 z-20"></div>
          <!-- Hours -->
          <div class="flex-1 relative">
            <div 
              v-for="hour in timeSlots" 
              :key="hour" 
              class="absolute w-full text-right pr-2 text-[10px] lg:text-xs text-slate-400 font-medium -mt-2.5"
              :style="{ top: `${((hour - calendarStartHour) / totalHours) * 100}%` }"
            >
              <span v-if="hour !== calendarStartHour">{{ formatHour(hour) }}</span>
            </div>
          </div>
        </div>

        <!-- Days Grid -->
        <div class="flex-1 min-w-[600px] grid grid-cols-7 relative">
          <div 
            v-for="day in weekDays" 
            :key="day.toISOString()" 
            class="flex flex-col border-r border-slate-100 last:border-r-0 relative group"
          >
            <!-- Day Header -->
            <div class="h-16 lg:h-20 border-b border-slate-200 flex flex-col items-center justify-center bg-slate-50 sticky top-0 z-20 transition-colors group-hover:bg-slate-100">
              <div class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 lg:mb-1">{{ getDayName(day) }}</div>
              <div class="text-base lg:text-lg font-bold" :class="formatISODate(day) === formatISODate(new Date()) ? 'text-indigo-600 bg-indigo-100 w-7 h-7 lg:w-9 lg:h-9 flex items-center justify-center rounded-full' : 'text-slate-700'">
                {{ day.getDate() }}
              </div>
            </div>

            <!-- Day Timeline (with Grid Lines) -->
            <div class="flex-1 relative bg-white" style="min-height: 800px;">
              <!-- Horizontal Grid Lines -->
              <div 
                v-for="hour in timeSlots" 
                :key="'line-'+hour" 
                class="absolute w-full border-t border-slate-100"
                :class="{ 'border-slate-200': hour === calendarStartHour || hour === calendarEndHour }"
                :style="{ top: `${((hour - calendarStartHour) / totalHours) * 100}%`, zIndex: 0 }"
              ></div>

              <!-- Current Time Indicator (Optional enhancement: add red line for current time) -->
              
              <!-- Sessions -->
              <div 
                v-for="session in getSessionsForDate(day)" 
                :key="session.id"
                @click="router.push({ name: 'track-admin-engagement-details', params: { id: session.parentEngagement.id } })"
                class="absolute rounded-md border cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] hover:z-20 overflow-hidden flex flex-col backdrop-blur-sm shadow-sm"
                :class="getCardStyle(session.parentEngagement.type)"
                :style="getSessionPosition(session)"
              >
                <!-- Color bar -->
                <div class="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5" :class="getBadgeStyle(session.parentEngagement.type)"></div>
                
                <div class="pl-2 lg:pl-3 p-1 lg:p-2 flex flex-col h-full overflow-hidden">
                  <div class="text-[9px] lg:text-[10px] font-black uppercase tracking-wider opacity-80 truncate">
                    {{ session.parentEngagement.type.replace('_', ' ') }}
                  </div>
                  <div class="text-[10px] lg:text-xs font-bold leading-tight truncate text-slate-800 mt-0.5">
                    {{ session.parentEngagement.instructor?.name || 'Instructor' }}
                  </div>
                  <div class="text-[9px] opacity-75 mt-auto truncate font-medium flex items-center gap-1">
                    <svg class="w-2.5 h-2.5 lg:w-3 lg:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ formatTimeRange(session) }}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Sidebar (Moved Below) -->
    <div class="w-full bg-white shadow-lg rounded-sm border border-slate-200 p-6">
      <h2 class="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Upcoming Sessions</h2>
      
      <div v-if="engagementStore.isLoading" class="text-center py-4">Loading...</div>
      
      <div v-else-if="upcomingSessions.length === 0" class="text-sm text-slate-500 text-center py-4">
        No upcoming sessions scheduled.
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div v-for="session in upcomingSessions" :key="`upcoming-${session.id}`" class="flex gap-4 border border-slate-100 rounded-lg p-4 bg-slate-50 hover:shadow-md transition-shadow">
          <!-- Date badge -->
          <div class="flex flex-col items-center justify-center bg-slate-50 rounded px-3 py-2 min-w-[60px] border border-slate-100">
            <span class="text-xl font-bold text-slate-700">{{ new Date(session.session_date).getDate() }}</span>
            <span class="text-xs font-medium text-slate-500 uppercase">{{ new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' }) }}</span>
          </div>
          
          <!-- Details -->
          <div class="flex-1 flex flex-col justify-center">
            <div class="text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
               <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" :class="getBadgeStyle(session.parentEngagement.type)">
                 {{ session.parentEngagement.type.replace('_', ' ') }}
               </span>
            </div>
            <div class="text-sm font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors" @click="router.push({ name: 'track-admin-engagement-details', params: { id: session.parentEngagement.id } })">
              {{ session.parentEngagement.instructor?.name }}
            </div>
            <div class="text-xs text-slate-500 mt-1">
              {{ formatFriendlyDate(session.session_date) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>
