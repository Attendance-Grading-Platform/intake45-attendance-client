import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Cohort, CohortDetail, CohortRow, CreateCohortPayload } from '@/types/cohort.types'

export const getCohorts = () =>
    api.get<ApiResponse<Cohort[]>>('/v1/cohorts')

export const getCohortStudents = (cohortId: number) =>
    api.get<ApiResponse<any[]>>(`/v1/cohorts/${cohortId}/students`)

export const getCohort = (id: number) =>
    api.get<ApiResponse<CohortDetail>>(`/v1/cohorts/${id}`)

export const listCohorts = () =>
    api.get<ApiResponse<CohortRow[]>>('/v1/cohorts')

export const createCohort = (data: CreateCohortPayload) =>
    api.post<ApiResponse<CohortRow>>('/v1/cohorts', data)

export const closeCohort = (id: number) =>
    api.put<ApiResponse<CohortRow>>(`/v1/cohorts/${id}/close`)

export const assignAdmin = (id: number, userId: number) =>
    api.post<ApiResponse<void>>(`/v1/cohorts/${id}/assign-admin`, { user_id: userId })
