export interface Grade {
    id: number
    student_id: number
    course_component_id: number
    raw_score: number
    raw_max: number
    normalized_score: number
    graded_by: number
    lab_group_id: number | null
}

export interface GradeOverride {
    id: number
    grade_id: number
    original_value: number
    new_value: number
    override_note: string
    overridden_by: number
    overridden_at: string
}
