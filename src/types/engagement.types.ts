export interface UpcomingSession {
    id:       number
    title:    string
    date:     string
    time:     string
    location: string
    type:     EngagementType
}

export type EngagementType = 'lecture' | 'lab' | 'business_session'

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
    cohort_id: number
    type: EngagementType
    instructor_id: number
    date_start: string
    date_end: string
    hours_per_session: number
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
