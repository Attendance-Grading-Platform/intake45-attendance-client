import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Announcement } from '@/types/announcement.types'

export const getCohortAnnouncements = (cohortId: number) =>
    api.get<ApiResponse<Announcement[]>>(`/v1/cohorts/${cohortId}/announcements`)

export const getStudentAnnouncements = () =>
    api.get<ApiResponse<Announcement[]>>(`/v1/me/announcements`)

export interface CreateAnnouncementPayload {
    cohort_id: number
    title: string
    body: string
}

export const getInstructorAnnouncements = (page: number = 1) =>
    api.get<ApiResponse<any>>(`/v1/announcements?page=${page}`)

export const createAnnouncement = (payload: CreateAnnouncementPayload) =>
    api.post<ApiResponse<Announcement>>(`/v1/announcements`, payload)
