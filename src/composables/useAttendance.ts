import { ref } from 'vue'
import api from '@/api/axios'
import type { AttendanceRecord } from '@/types/attendance.types'

export interface StudentAttendanceSummary {
    student_id: number
    student_name: string
    ledger_balance: number
    is_at_risk: boolean
    records: AttendanceRecord[]
}

export function useAttendance() {
    const attendance = ref<StudentAttendanceSummary | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const fetchMyAttendance = async () => {
        isLoading.value = true
        error.value = null
        try {
            const res = await api.get('/v1/me/attendance')
            attendance.value = res.data.data ?? null
        } catch (e) {
            const err = e as { response?: { data?: { message?: string } } }
            error.value = err.response?.data?.message ?? 'Failed to fetch attendance'
        } finally {
            isLoading.value = false
        }
    }

    const fetchStudentAttendance = async (studentId: number) => {
        isLoading.value = true
        error.value = null
        try {
            const res = await api.get(`/v1/students/${studentId}/attendance`)
            attendance.value = res.data.data ?? null
        } catch (e) {
            const err = e as { response?: { data?: { message?: string } } }
            error.value = err.response?.data?.message ?? 'Failed to fetch student attendance'
        } finally {
            isLoading.value = false
        }
    }

    return { attendance, isLoading, error, fetchMyAttendance, fetchStudentAttendance }
}
