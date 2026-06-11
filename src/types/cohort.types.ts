export interface Cohort {
    id: number
    track_id: number
    name: string
    status: 'active' | 'closed'
    started_at: string
    ended_at: string
    created_at: string
    updated_at: string
}

export interface CourseComponent {
    id: number
    type: 'lab_deliverable' | 'final_exam'
    weight: number
    due_date: string | null
}

export interface Course {
    id: number
    name: string
    components: CourseComponent[]
}

export interface CohortDetail {
    id: number
    name: string
    status: 'active' | 'closed'
    started_at: string
    ended_at: string | null
    track: { id: number; name: string }
    students_count: number
    courses: Course[]
}

export interface Track {
    id: number
    name: string
}

export interface CohortRow {
    id: number
    name: string
    status: 'active' | 'closed'
    started_at: string
    ended_at: string | null
    track: { id: number; name: string }
    students_count: number
    track_admins: Array<{ id: number; name: string }>
}

export interface CreateCohortPayload {
    track_id: number
    name: string
    started_at: string
    ended_at: string | null
    admin_ids: number[]
}
