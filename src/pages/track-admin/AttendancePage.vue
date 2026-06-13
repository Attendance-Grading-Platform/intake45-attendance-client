<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'

interface Student {
  id: number
  name: string
  cohort: string
  status: 'present' | 'absent' | 'late' | null
}

const students = ref<Student[]>([])
const selectedTrack = ref('Frontend')
const selectedCohort = ref('Oct23')
const todayDate = ref(new Date().toISOString().split('T')[0])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const fetchAttendanceList = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await api.get('/v1/attendances', {
      params: {
        track: selectedTrack.value,
        cohort: selectedCohort.value,
        date: todayDate.value
      }
    })
    if (response.data && response.data.success) {
      students.value = response.data.data
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message || 'Failed to fetch student attendance roster.'
  } finally {
    isLoading.value = false
  }
}

const setStudentStatus = (studentId: number, status: 'present' | 'absent' | 'late') => {
  const student = students.value.find(s => s.id === studentId)
  if (student) {
    student.status = student.status === status ? null : status
  }
}

const submitAttendance = async () => {
  const unrecorded = students.value.some(s => s.status === null)
  if (unrecorded) {
    errorMessage.value = 'Please record attendance for all students before submitting.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await api.post('/v1/attendances/submit', {
      track: selectedTrack.value,
      cohort: selectedCohort.value,
      date: todayDate.value,
      records: students.value.map(s => ({
        student_id: s.id,
        status: s.status
      }))
    })

    if (response.data && response.data.success) {
      successMessage.value = 'Daily attendance roster submitted and saved successfully.'
      setTimeout(() => (successMessage.value = ''), 4000)
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message || 'Failed to submit attendance records.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchAttendanceList()
})
</script>

<template>
  <div class="p-6">
    <header class="mb-10">
      <span class="text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase mb-1 block">Roster Operations · Open Source Track</span>
      <h2 class="text-3xl font-serif font-semibold text-[#1b1b1b] mb-4">Daily Attendance</h2>
      <div class="h-px bg-[#C9BDB8] w-full"></div>
    </header>

    <div class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 shadow-sm mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
        <div>
          <label class="block text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase mb-2">Today's Date</label>
          <input
            v-model="todayDate"
            type="date"
            @change="fetchAttendanceList"
            class="w-full text-sm border border-[#C9BDB8] rounded bg-[#f9f9f9] focus:bg-white focus:border-[#940002] focus:ring-0 p-3 transition-colors"
          />
        </div>

        <div>
          <label class="block text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase mb-2">Track Branch</label>
          <select
            v-model="selectedTrack"
            @change="fetchAttendanceList"
            class="w-full text-sm border border-[#C9BDB8] rounded bg-[#f9f9f9] focus:bg-white focus:border-[#940002] focus:ring-0 p-3 transition-colors"
          >
            <option value="Frontend">Frontend Development</option>
            <option value="Open Source">Open Source Track</option>
            <option value="Full Stack">Full Stack Development</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase mb-2">Academic Cohort</label>
          <select
            v-model="selectedCohort"
            @change="fetchAttendanceList"
            class="w-full text-sm border border-[#C9BDB8] rounded bg-[#f9f9f9] focus:bg-white focus:border-[#940002] focus:ring-0 p-3 transition-colors"
          >
            <option value="Oct23">Engineering Batch A-23</option>
            <option value="Intake45">Intake 45</option>
            <option value="Intake46">Intake 46</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-white border-l-4 border-[#ba1a1a] text-sm font-medium text-black flex justify-between items-center shadow-sm rounded-sm">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="text-black font-bold hover:opacity-70">✕</button>
    </div>

    <div v-if="successMessage" class="mb-6 p-4 bg-white border-l-4 border-[#940002] text-sm font-medium text-black flex justify-between items-center shadow-sm rounded-sm">
      <span>{{ successMessage }}</span>
      <button @click="successMessage = ''" class="text-black font-bold hover:opacity-70">✕</button>
    </div>

    <div v-if="isLoading" class="py-24 text-center bg-white border border-[#C9BDB8] rounded-[10px]">
      <span class="text-xs uppercase tracking-[1.5px] text-[#4c4546] font-bold animate-pulse">Syncing student ledger roster...</span>
    </div>

    <div v-else class="bg-white border border-[#C9BDB8] rounded-[10px] shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-[#C9BDB8] bg-[#eeeeee]/60">
            <th class="py-4 px-6 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Student ID</th>
            <th class="py-4 px-6 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Full Name</th>
            <th class="py-4 px-6 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">Cohort</th>
            <th class="py-4 px-6 text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase text-center w-1/3">Status Check</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#eeeeee]">
          <tr v-for="student in students" :key="student.id" class="hover:bg-[#f3f3f3]/50 transition-colors duration-150 text-sm">
            <td class="py-4 px-6 font-mono text-[#4c4546] font-medium">#{{ student.id }}</td>
            <td class="py-4 px-6 font-semibold text-[#1b1b1b]">{{ student.name }}</td>
            <td class="py-4 px-6 text-[#4c4546] font-medium">{{ student.cohort }}</td>
            <td class="py-4 px-6">
              <div class="flex justify-center gap-2">
                <button
                  @click="setStudentStatus(student.id, 'present')"
                  :class="student.status === 'present' ? 'bg-[#6a624b] text-white border-[#6a624b]' : 'bg-[#f9f9f9] text-[#4c4546] border-[#C9BDB8] hover:bg-[#ebdfc2]/30'"
                  class="text-[10px] uppercase tracking-[1px] font-bold border px-3 py-1.5 transition-all duration-150 w-24 text-center rounded-sm"
                >
                  Present
                </button>
                <button
                  @click="setStudentStatus(student.id, 'absent')"
                  :class="student.status === 'absent' ? 'bg-[#940002] text-white border-[#940002]' : 'bg-[#f9f9f9] text-[#4c4546] border-[#C9BDB8] hover:bg-red-50'"
                  class="text-[10px] uppercase tracking-[1px] font-bold border px-3 py-1.5 transition-all duration-150 w-24 text-center rounded-sm"
                >
                  Absent
                </button>
                <button
                  @click="setStudentStatus(student.id, 'late')"
                  :class="student.status === 'late' ? 'bg-[#ebdfc2] text-[#211b09] border-[#C9BDB8] font-black' : 'bg-[#f9f9f9] text-[#4c4546] border-[#C9BDB8] hover:bg-[#eeeeee]'"
                  class="text-[10px] uppercase tracking-[1px] font-bold border px-3 py-1.5 transition-all duration-150 w-24 text-center rounded-sm"
                >
                  Late
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="p-6 bg-[#eeeeee]/30 border-t border-[#C9BDB8] flex justify-between items-center">
        <p class="text-[11px] font-bold tracking-[1.5px] text-[#4c4546] uppercase">
          Total Pool: <span class="text-[#940002] font-bold">{{ students.length }} Records</span>
        </p>
        <button
          @click="submitAttendance"
          :disabled="isSubmitting || students.length === 0"
          class="text-[11px] font-bold tracking-[1.5px] border border-[#940002] bg-[#940002] text-white hover:bg-white hover:text-[#940002] disabled:opacity-40 px-8 py-3.5 transition-all duration-200 uppercase rounded-ui"
        >
          {{ isSubmitting ? 'Saving Records...' : 'Submit Attendance' }}
        </button>
      </div>
    </div>
  </div>
</template>
