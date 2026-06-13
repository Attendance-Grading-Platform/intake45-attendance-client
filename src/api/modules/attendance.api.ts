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

export const getStudentAttendance = () =>
    api.get<ApiResponse<StudentAttendanceResponse>>(`/v1/me/attendance`)

export interface ScanPayload {
    session_id: number
    student_id: number
}

export const scanSessionQR = (payload: ScanPayload) =>
    api.post<ApiResponse<void>>('/v1/attendance/scan', payload)

// Pre-flight check for instructors to get their active sessions right now
export const getActiveSessions = () =>
    api.get<ApiResponse<{ id: number, engagement_id: number }[]>>('/v1/sessions/active')

export const getSessionAttendance = (sessionId: number) =>
    api.get<ApiResponse<{
        session_id: number
        session_date: string
        records: Array<{ student_id: number; arrived_at: string | null }>
    }>>(`/v1/sessions/${sessionId}/attendance`)
