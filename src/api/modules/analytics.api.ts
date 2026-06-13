import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { CohortAnalytics } from '@/types/analytics.types'

export const getCohortAnalytics = (cohortId: number) =>
    api.get<ApiResponse<CohortAnalytics>>(`/v1/analytics/cohorts/${cohortId}`)

export const getBranchAnalytics = () =>
    api.get<ApiResponse<CohortAnalytics[]>>('/v1/analytics/branch')

export const getAtRiskStudents = (cohortId: number) =>
    api.get<ApiResponse<{
        cohort_name: string
        at_risk_count: number
        at_risk_students: CohortAnalytics['students']
    }>>(`/v1/analytics/at-risk/${cohortId}`)
