<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { RefreshCw, CheckCircle, XCircle, Clock } from '@lucide/vue'

interface SessionOption {
  id: number
  session_date: string
  engagement?: { title?: string; type?: string }
}

interface AttendanceRecord {
  id: number
  student_id: number
  arrived_at: string | null
  left_at: string | null
  student?: { id: number; name: string; email: string }
}

const sessions = ref<SessionOption[]>([])
const selectedSessionId = ref<number | null>(null)
const attendanceRecords = ref<AttendanceRecord[]>([])
const isLoadingSessions = ref(false)
const isLoadingAttendance = ref(false)
const errorMessage = ref('')
const isMarkingAbsent = ref(false)
const selectedStudentIds = ref<Set<number>>(new Set())

const fetchSessions = async () => {
  isLoadingSessions.value = true
  errorMessage.value = ''
  try {
    // Get all engagements, then get their sessions
    const engRes = await api.get('/v1/engagements').catch(() => ({ data: { data: [] } }))
    const engagements = engRes.data.data ?? []

    const allSessions: SessionOption[] = []
    for (const eng of engagements.slice(0, 5)) {
      try {
        const sessRes = await api.get(`/v1/engagements/${eng.id}/sessions`)
        const sessList = sessRes.data.data ?? []
        sessList.forEach((s: SessionOption) => {
          allSessions.push({ ...s, engagement: eng })
        })
      } catch {
        // skip if forbidden
      }
    }

    sessions.value = allSessions.sort((a, b) =>
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    )

    if (sessions.value.length > 0 && !selectedSessionId.value) {
      selectedSessionId.value = sessions.value[0]!.id
      await fetchAttendance()
    }
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message ?? 'Failed to load sessions.'
  } finally {
    isLoadingSessions.value = false
  }
}

const fetchAttendance = async () => {
  if (!selectedSessionId.value) return
  isLoadingAttendance.value = true
  attendanceRecords.value = []
  selectedStudentIds.value = new Set()
  try {
    const res = await api.get(`/v1/sessions/${selectedSessionId.value}/attendance`)
    attendanceRecords.value = res.data.data?.records ?? []
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message ?? 'Failed to load attendance.'
  } finally {
    isLoadingAttendance.value = false
  }
}

const markAbsent = async () => {
  if (!selectedSessionId.value || selectedStudentIds.value.size === 0) return
  isMarkingAbsent.value = true
  try {
    await api.post(`/v1/sessions/${selectedSessionId.value}/mark-absent`, {
      student_ids: Array.from(selectedStudentIds.value)
    })
    await fetchAttendance()
    selectedStudentIds.value = new Set()
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message ?? 'Failed to mark students absent.'
  } finally {
    isMarkingAbsent.value = false
  }
}

const toggleStudent = (id: number) => {
  if (selectedStudentIds.value.has(id)) selectedStudentIds.value.delete(id)
  else selectedStudentIds.value.add(id)
}

const getStatusLabel = (record: AttendanceRecord) => {
  if (record.arrived_at && record.left_at) return 'Present'
  if (record.arrived_at && !record.left_at) return 'Checked In'
  return 'Absent'
}

const getStatusClass = (record: AttendanceRecord) => {
  if (record.arrived_at && record.left_at) return 'bg-green-50 text-green-700 border border-green-200'
  if (record.arrived_at) return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

onMounted(fetchSessions)
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] p-6">
    <div class="mb-8">
      <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] block mb-1">
        Track Administration
      </span>
      <h1 class="font-serif text-[36px] text-[#1b1b1b] leading-tight">Session Attendance</h1>
      <div class="h-px bg-[#C9BDB8] w-full mt-4"></div>
    </div>

    <!-- Session Selector -->
    <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 mb-6 shadow-sm">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="block text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase mb-2">Select Session</label>
          <select
            v-model="selectedSessionId"
            @change="fetchAttendance"
            :disabled="isLoadingSessions"
            class="w-full text-sm border border-[#C9BDB8] rounded bg-[#f9f9f9] focus:bg-white focus:border-[#940002] focus:ring-0 p-3 transition-colors disabled:opacity-50"
          >
            <option :value="null" disabled>Choose a session...</option>
            <option v-for="s in sessions" :key="s.id" :value="s.id">
              {{ s.session_date }} — {{ s.engagement?.type ?? 'Session' }}
            </option>
          </select>
        </div>
        <button
          @click="fetchAttendance"
          :disabled="isLoadingAttendance || !selectedSessionId"
          class="h-11 px-5 bg-[#940002] text-white rounded flex items-center gap-2 text-sm font-medium hover:bg-[#7a0002] transition-colors disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoadingAttendance }" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMessage" class="mb-4 p-4 bg-white border-l-4 border-[#ba1a1a] text-sm font-medium text-black flex justify-between items-center rounded">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="font-bold">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoadingAttendance" class="py-16 text-center bg-white border border-[#C9BDB8] rounded-[10px]">
      <RefreshCw class="w-6 h-6 text-[#940002] animate-spin mx-auto mb-2" />
      <span class="text-xs uppercase tracking-[1.5px] text-[#4c4546] font-bold">Loading attendance...</span>
    </div>

    <!-- No session selected -->
    <div v-else-if="!selectedSessionId" class="py-16 text-center bg-white border border-[#C9BDB8] rounded-[10px] text-[#888]">
      <Clock class="w-12 h-12 mx-auto mb-3 text-[#C9BDB8]" />
      <p class="text-sm">Select a session to view attendance records.</p>
    </div>

    <!-- Attendance Table -->
    <div v-else class="bg-white border border-[#C9BDB8] rounded-[10px] shadow-sm overflow-hidden">
      <div class="p-4 border-b border-[#C9BDB8] flex items-center justify-between">
        <p class="font-sans text-sm font-semibold text-[#1b1b1b]">
          {{ attendanceRecords.length }} record(s)
        </p>
        <button
          v-if="selectedStudentIds.size > 0"
          @click="markAbsent"
          :disabled="isMarkingAbsent"
          class="h-9 px-4 bg-[#940002] text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-[#7a0002] transition-colors disabled:opacity-50"
        >
          <XCircle class="w-4 h-4" />
          Mark {{ selectedStudentIds.size }} as Absent
        </button>
      </div>

      <div v-if="attendanceRecords.length === 0" class="py-16 text-center text-sm text-[#888] italic">
        No attendance records for this session yet.
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-[#C9BDB8] bg-[#F5EDEA]">
            <th class="py-3 px-4 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase w-10"></th>
            <th class="py-3 px-4 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Student</th>
            <th class="py-3 px-4 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Arrived At</th>
            <th class="py-3 px-4 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Left At</th>
            <th class="py-3 px-4 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#eeeeee]">
          <tr v-for="record in attendanceRecords" :key="record.id" class="hover:bg-[#f9f9f9] transition-colors">
            <td class="py-3 px-4">
              <input
                type="checkbox"
                :checked="selectedStudentIds.has(record.student_id)"
                @change="toggleStudent(record.student_id)"
                class="w-4 h-4 accent-[#940002] cursor-pointer"
              />
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <CheckCircle v-if="record.arrived_at" class="w-4 h-4 text-green-500 shrink-0" />
                <XCircle v-else class="w-4 h-4 text-red-400 shrink-0" />
                <span class="font-semibold text-sm text-[#1b1b1b]">{{ record.student?.name ?? `Student #${record.student_id}` }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-[#4c4546] font-mono">
              {{ record.arrived_at ? new Date(record.arrived_at).toLocaleTimeString() : '—' }}
            </td>
            <td class="py-3 px-4 text-sm text-[#4c4546] font-mono">
              {{ record.left_at ? new Date(record.left_at).toLocaleTimeString() : '—' }}
            </td>
            <td class="py-3 px-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.5px]" :class="getStatusClass(record)">
                {{ getStatusLabel(record) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
