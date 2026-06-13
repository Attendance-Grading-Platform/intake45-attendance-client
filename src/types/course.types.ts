export interface CourseComponent {
    id:         number
    type:       'lab_deliverable' | 'final_exam'
    weight:     number
    due_date:   string | null
    has_grades: boolean
}

export interface Course {
    id:           number
    name:         string
    components:   CourseComponent[]
    total_weight: number
}

export interface CreateCoursePayload {
    name: string
}

export interface CreateComponentPayload {
    type:     'lab_deliverable' | 'final_exam'
    weight:   number
    due_date: string | null
}

export interface UpdateComponentPayload {
    weight:   number
    due_date: string | null
}

export interface ComponentFormState {
    included: boolean
    weight:   number
    due_date: string | null
    has_grades?: boolean
    id?:        number
}
