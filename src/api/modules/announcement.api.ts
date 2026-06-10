import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Announcement } from '@/types/announcement.types'

export const getCohortAnnouncements = (cohortId: number) =>
    api.get<ApiResponse<Announcement[]>>(`/v1/cohorts/${cohortId}/announcements`)
