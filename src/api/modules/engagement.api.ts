// src/api/modules/engagement.api.ts
import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Engagement, StoreEngagementPayload } from '@/types/engagement.types'

export const getEngagements = (params?: any) =>
    api.get<ApiResponse<Engagement[]>>('/v1/engagements', { params })

export const getEngagementById = (id: number) =>
    api.get<ApiResponse<Engagement>>(`/v1/engagements/${id}`)

export const createEngagement = (data: StoreEngagementPayload) =>
    api.post<ApiResponse<{ engagement: Engagement; sessions: any[]; sessions_count: number }>>('/v1/engagements', data)
