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

export const getEngagementDeliverables = (engagementId: number, page = 1) => {
  return api.get<ApiResponse<{
    data: Array<{ id: number; status: string; grade?: { raw_score: number } | null }>
    total: number
  }>>(`/v1/engagements/${engagementId}/deliverables`, { params: { page, per_page: 100 } })
}
