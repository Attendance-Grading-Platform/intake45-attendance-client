import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as attendanceApi from '@/api/modules/attendance.api'
import type { StudentAttendanceResponse } from '@/api/modules/attendance.api'

export const useAttendanceStore = defineStore('attendance', () => {
    const studentAttendance = ref<StudentAttendanceResponse | null>(null)
    const isLoading = ref(false)

    async function fetchStudentAttendance(studentId: number) {
        isLoading.value = true
        try {
            const res = await attendanceApi.getStudentAttendance(studentId)
            studentAttendance.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    return { studentAttendance, isLoading, fetchStudentAttendance }
})
