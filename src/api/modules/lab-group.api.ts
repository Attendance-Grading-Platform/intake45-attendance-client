import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { LabGroup, LabGroupStudent, CreateLabGroupPayload, AssignStudentsPayload, AssignInstructorPayload } from '@/types/cohort.types'
import type { UserSummary } from '@/api/modules/user.api'

export const listStudents = (cohortId: number) =>
    api.get<ApiResponse<LabGroupStudent[]>>(`/v1/cohorts/${cohortId}/students`)

export const listLabGroups = (cohortId: number) =>
    api.get<ApiResponse<LabGroup[]>>(`/v1/cohorts/${cohortId}/lab-groups`)

export const listInstructors = () =>
    api.get<ApiResponse<UserSummary[]>>('/v1/auth/users', { params: { role: 'instructor' } })

export const createLabGroup = (cohortId: number, data: CreateLabGroupPayload) =>
    api.post<ApiResponse<LabGroup>>(`/v1/cohorts/${cohortId}/lab-groups`, data)

export const assignStudents = (groupId: number, data: AssignStudentsPayload) =>
    api.post<ApiResponse<any>>(`/v1/lab-groups/${groupId}/students`, data)

export const assignInstructor = (groupId: number, data: AssignInstructorPayload) =>
    api.post<ApiResponse<any>>(`/v1/lab-groups/${groupId}/instructors`, data)

export const removeStudent = (groupId: number, studentId: number) =>
    api.delete<ApiResponse<any>>(`/v1/lab-groups/${groupId}/students/${studentId}`)
