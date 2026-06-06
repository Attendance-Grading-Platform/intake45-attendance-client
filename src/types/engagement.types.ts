export type EngagementType = 'lecture' | 'lab' | 'business_session'

export interface Engagement {
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
