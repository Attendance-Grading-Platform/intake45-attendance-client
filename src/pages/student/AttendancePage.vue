<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StudentBadge from '@/components/attendance/StudentBadge.vue'
import { useAuthStore } from '@/stores/auth.store'
import { getStudentAttendance, type StudentAttendanceResponse } from '@/api/modules/attendance.api'

const authStore = useAuthStore()
const attendanceData = ref<StudentAttendanceResponse | null>(null)
const isLoading = ref(true)

onMounted(async () => {
    if (authStore.user?.id) {
        try {
            const res = await getStudentAttendance()
            attendanceData.value = res.data.data
        } catch (err) {
            console.error('Failed to fetch attendance records', err)
        } finally {
            isLoading.value = false
        }
    }
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-8">
    
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">My Attendance</h1>
      <p class="text-slate-500 mt-1">View your attendance records and access your digital check-in badge.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column: The Permanent Badge -->
      <div class="lg:col-span-1">
        <StudentBadge />
      </div>

      <!-- Right Column: Attendance Stats & History -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
                <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <div class="text-sm font-medium text-slate-500">Ledger Balance</div>
                    <div class="text-2xl font-bold text-slate-800">
                        <span v-if="isLoading">--</span>
                        <span v-else>{{ attendanceData?.ledger_balance ?? 100 }}</span>
                        <span class="text-sm font-normal text-slate-400 ml-1">pts</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
                <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4" :class="attendanceData?.is_at_risk ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'">
                    <svg v-if="attendanceData?.is_at_risk" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <div class="text-sm font-medium text-slate-500">Status</div>
                    <div class="text-xl font-bold" :class="attendanceData?.is_at_risk ? 'text-rose-600' : 'text-emerald-600'">
                        <span v-if="isLoading">--</span>
                        <span v-else-if="attendanceData?.is_at_risk">At Risk</span>
                        <span v-else>Good Standing</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Attendance Records Table Placeholder -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 class="text-lg font-bold text-slate-800">Recent Records</h2>
            </div>
            
            <div v-if="isLoading" class="p-8 flex justify-center">
                <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <div v-else-if="!attendanceData?.records?.length" class="p-8 text-center text-slate-500">
                No recent attendance records found.
            </div>
            <div v-else class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-6 py-3 font-semibold">Session</th>
                            <th class="px-6 py-3 font-semibold">Date</th>
                            <th class="px-6 py-3 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="record in attendanceData.records" :key="record.id" class="hover:bg-slate-50">
                            <td class="px-6 py-4 font-medium text-slate-800">
                                Session #{{ record.session_id }}
                            </td>
                            <td class="px-6 py-4 text-slate-500">
                                {{ record.arrived_at ? new Date(record.arrived_at).toLocaleDateString() : '---' }}
                            </td>
                            <td class="px-6 py-4">
                                <span v-if="record.arrived_at" class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase">Present</span>
                                <span v-else class="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold uppercase">Absent</span>
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
