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

export interface TrackRef {
    id: number
    name: string
}

export interface ActiveCohort {
    id: number
    name: string
    status: 'active' | 'closed'
    started_at: string
    ended_at: string | null
    students_count: number
}

export interface Track {
    id: number
    name: string
    active_cohort: ActiveCohort | null
    cohorts_count: number
}

export interface CohortRow {
    id: number
    name: string
    track_id: number
    started_at: string
    closed_at: string | null
    status: 'active' | 'closed'
    students_count: number
    track: TrackRef
    track_admins: Array<{ id: number; name: string }>
}

// ── Lab Groups ────────────────────────────────────────────────
export interface LabGroupStudent {
    id: number
    name: string
    email: string
}
export type Student = LabGroupStudent

export interface LabGroupInstructor {
    id: number
    name: string
    email: string
}

export interface LabGroup {
    id: number    // 0 if not yet saved to backend
    name: string
    instructor: LabGroupInstructor | null
    students: LabGroupStudent[]
}

export interface CreateLabGroupPayload {
    name: string
}

export interface AssignStudentsPayload {
    user_ids: number[]
}

export interface AssignInstructorPayload {
    user_ids: number[]
}

export interface CreateCohortPayload {
    track_id: number
    name: string
    started_at: string
    ended_at: string | null
    admin_ids: number[]
}
