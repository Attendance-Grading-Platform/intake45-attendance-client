export type EngagementType = 'lecture' | 'lab' | 'business_session'

export interface EngagementSession {
    id: number
    engagement_id: number
    session_date: string
    delivered: boolean
    delivered_at: string | null
    created_at: string
}

export interface Engagement {
    id: number
    instructor_id: number
    type: EngagementType
    start_date: string
    end_date: string
    hours_per_session: string
    scheduled_hours: number
    days_of_week: number[]
    created_at: string
    instructor?: {
        id: number
        name: string
        email: string
    }
    cohorts?: {
        id: number
        name: string
    }[]
    sessions?: EngagementSession[]
}

export interface StoreEngagementPayload {
    cohort_id: number
    instructor_id: number
    type: EngagementType
    start_date: string
    end_date: string
    scheduled_hours: number
    days_of_week: number[]
}

export interface LabDeliverable {
    id: number
    student_id: number
    engagement_id: number
    submitted_at: string
    submission_type: 'url' | 'file'
    submission_url: string | null
    file_path: string | null
    raw_score: number | null
    days_late: number
    final_score: number
}
