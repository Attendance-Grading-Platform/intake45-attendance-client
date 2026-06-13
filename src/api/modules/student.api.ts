import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface StudentProfile {
    id: number
    name: string
    email: string
    role: string
    compensation_type?: 'internal' | 'external' | null
    hourly_rate?: number | null
    fixed_salary?: number | null
    expiry_date?: string | null
    created_at?: string
}

export const getStudents = (params?: { cohort_id?: number; role?: string }) =>
    api.get<ApiResponse<StudentProfile[]>>('/v1/auth/users', { params })

export const getStudent = (id: number) =>
    api.get<ApiResponse<StudentProfile>>(`/v1/auth/users/${id}`)

export const createStudent = (data: Partial<StudentProfile> & { password: string; role: string }) =>
    api.post<ApiResponse<StudentProfile>>('/v1/auth/users', data)

export const updateStudent = (id: number, data: Partial<StudentProfile>) =>
    api.put<ApiResponse<StudentProfile>>(`/v1/auth/users/${id}`, data)

export const deleteStudent = (id: number) =>
    api.delete<ApiResponse<null>>(`/v1/auth/users/${id}`)

export const getStudentGrades = (studentId: number) =>
    api.get<ApiResponse<unknown>>(`/v1/students/${studentId}/grades`)

export const getStudentLedger = (studentId: number) =>
    api.get<ApiResponse<unknown>>(`/v1/students/${studentId}/ledger`)

export const getStudentAttendance = (studentId: number) =>
    api.get<ApiResponse<unknown>>(`/v1/students/${studentId}/attendance`)

export const getStudentTags = (studentId: number) =>
    api.get<ApiResponse<unknown[]>>(`/v1/students/${studentId}/tags`)

export const addStudentTag = (studentId: number, tag: string) =>
    api.post<ApiResponse<unknown>>(`/v1/students/${studentId}/tags`, { tag })

export const deleteStudentTag = (studentId: number, tagId: number) =>
    api.delete<ApiResponse<null>>(`/v1/students/${studentId}/tags/${tagId}`)

export const getStudentNotes = (studentId: number) =>
    api.get<ApiResponse<unknown[]>>(`/v1/students/${studentId}/notes`)

export const addStudentNote = (studentId: number, note: string) =>
    api.post<ApiResponse<unknown>>(`/v1/students/${studentId}/notes`, { note })
