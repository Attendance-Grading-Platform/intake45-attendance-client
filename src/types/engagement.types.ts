export interface UpcomingSession {
    id:       number
    title:    string
    date:     string
    time:     string
    location: string
    type:     EngagementType
}

export type EngagementType = 'lecture' | 'lab' | 'business'

export interface EngagementSession {
    id: number
    engagement_id: number
    session_date: string
    start_time?: string | null
    end_time?: string | null
    delivered: boolean
    delivered_at: string | null
    created_at: string
}

export interface Engagement {
    id:                number
    type:              EngagementType
    instructor:        { id: number; name: string }
    start_date:        string
    end_date:          string
    hours_per_session: number
    lab_groups:        Array<{ id: number; name: string }>
}

export interface LabGroupOption {
    id:            number
    name:          string
    student_count: number
}

export interface Instructor {
    id:    number
    name:  string
    email: string
}

export interface CreateEngagementPayload {
    type:              EngagementType
    instructor_id:     number
    start_date:        string
    end_date:          string
    hours_per_session: number
    lab_group_ids:     number[]
    cohort_ids?:       number[]
}

export interface UpdateEngagementPayload {
    type?:              EngagementType
    instructor_id?:     number
    start_date?:        string
    end_date?:          string
    hours_per_session?: number
    lab_group_ids?:     number[]
    cohort_ids?:        number[]
}

/** @deprecated legacy shape — prefer Engagement */
export interface LegacyEngagement {
    id: number
    instructor_id: number
    type: EngagementType
    start_date: string
    end_date: string
    hours_per_session: string
    scheduled_hours: number
    days_of_week: number[]
    daily_start_time?: string | null
    daily_end_time?: string | null
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
    daily_start_time?: string
    daily_end_time?: string
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
