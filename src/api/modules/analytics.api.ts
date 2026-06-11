import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export const getCohortAnalytics = (cohortId: number) =>
    api.get<ApiResponse<any>>(`/v1/analytics/cohorts/${cohortId}`)
