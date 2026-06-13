import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export const getCohortAnalytics = (cohortId: number) =>
    api.get<ApiResponse<unknown>>(`/v1/analytics/cohorts/${cohortId}`)

export const getBranchAnalytics = () =>
    api.get<ApiResponse<unknown[]>>('/v1/analytics/branch')

export const getAtRiskStudents = (cohortId: number) =>
    api.get<ApiResponse<unknown>>(`/v1/analytics/at-risk/${cohortId}`)
