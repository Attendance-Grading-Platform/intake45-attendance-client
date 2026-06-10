import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Cohort } from '@/types/cohort.types'

export const getCohorts = () =>
    api.get<ApiResponse<Cohort[]>>('/v1/cohorts')
