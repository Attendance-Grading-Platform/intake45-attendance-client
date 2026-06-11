import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
    Engagement,
    CreateEngagementPayload,
    UpdateEngagementPayload,
} from '@/types/engagement.types'

interface ApiEngagement {
    id:              number
    type:            Engagement['type']
    instructor_id:   number
    start_date:      string
    end_date:        string
    scheduled_hours: number
    instructor?:     { id: number; name: string; email?: string }
    lab_groups?:     Array<{ id: number; name: string }>
}

function mapEngagement(raw: ApiEngagement): Engagement {
    return {
        id:                raw.id,
        type:              raw.type,
        instructor:        raw.instructor ?? { id: raw.instructor_id, name: 'Unknown' },
        start_date:        raw.start_date,
        end_date:          raw.end_date,
        hours_per_session: raw.scheduled_hours,
        lab_groups:        raw.lab_groups ?? [],
    }
}

function getDaysOfWeekInRange(startDate: string, endDate: string): number[] {
    const days = new Set<number>()
    let current = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')

    while (current <= end) {
        days.add(current.getDay())
        current.setDate(current.getDate() + 1)
    }

    return Array.from(days).sort((a, b) => a - b)
}

function toApiCreateBody(cohortId: number, data: CreateEngagementPayload) {
    return {
        cohort_id:       cohortId,
        instructor_id:   data.instructor_id,
        type:            data.type,
        start_date:      data.start_date,
        end_date:        data.end_date,
        scheduled_hours: data.hours_per_session,
        days_of_week:    getDaysOfWeekInRange(data.start_date, data.end_date),
        ...(data.lab_group_ids.length > 0 ? { lab_group_ids: data.lab_group_ids } : {}),
    }
}

function toApiUpdateBody(data: UpdateEngagementPayload) {
    const body: Record<string, unknown> = {}

    if (data.instructor_id !== undefined) body.instructor_id = data.instructor_id
    if (data.type !== undefined) body.type = data.type
    if (data.start_date !== undefined) body.start_date = data.start_date
    if (data.end_date !== undefined) body.end_date = data.end_date
    if (data.hours_per_session !== undefined) body.scheduled_hours = data.hours_per_session

    if (data.start_date && data.end_date) {
        body.days_of_week = getDaysOfWeekInRange(data.start_date, data.end_date)
    }

    return body
}

export const listCohortEngagements = async (cohortId: number): Promise<Engagement[]> => {
    const res = await api.get<ApiResponse<ApiEngagement[]>>('/v1/engagements', {
        params: { cohort_id: cohortId },
    })

    return (res.data.data ?? []).map(mapEngagement)
}

export const createEngagement = async (
    cohortId: number,
    data: CreateEngagementPayload,
): Promise<Engagement> => {
    const res = await api.post<ApiResponse<{ engagement: ApiEngagement }>>(
        '/v1/engagements',
        toApiCreateBody(cohortId, data),
    )

    const responseData = res.data.data
    const raw: ApiEngagement = responseData && typeof responseData === 'object' && 'engagement' in responseData
        ? (responseData as { engagement: ApiEngagement }).engagement
        : responseData as ApiEngagement
    return mapEngagement(raw)
}

export const updateEngagement = async (
    id: number,
    data: UpdateEngagementPayload,
): Promise<Engagement> => {
    const res = await api.put<ApiResponse<ApiEngagement>>(
        `/v1/engagements/${id}`,
        toApiUpdateBody(data),
    )

    return mapEngagement(res.data.data)
}

export const deleteEngagement = (id: number) =>
    api.delete<ApiResponse<void>>(`/v1/engagements/${id}`)
