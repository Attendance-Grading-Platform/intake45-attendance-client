import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface SubmissionQueueParams {
  page?: number
  course_id?: number | string
  lab_group_id?: number | string
  status?: string
}

export const getSubmissionQueue = (params: SubmissionQueueParams) => {
  return api.get<ApiResponse<any>>('/v1/submissions/queue', { params })
}

export const getSubmissionStats = () => {
  return api.get<ApiResponse<any>>('/v1/submissions/stats')
}
