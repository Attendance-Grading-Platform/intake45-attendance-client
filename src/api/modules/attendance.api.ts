import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { AttendanceRecord } from '@/types/attendance.types'

export interface StudentAttendanceResponse {
    student_id: number
    student_name: string
    ledger_balance: number
    is_at_risk: boolean
    records: AttendanceRecord[]
}

export const getStudentAttendance = (studentId: number) =>
    api.get<ApiResponse<StudentAttendanceResponse>>(`/v1/students/${studentId}/attendance`)
