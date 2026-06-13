import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Grade {
    id: number
    student_id: number
    student_name?: string
    raw_score: number
    raw_max: number
    normalized_score: number
    final_score: number
    course_component_id?: number
    component_name?: string
    graded_by_name?: string
    original_value?: number | null
    override_note?: string | null
    overridden_by_name?: string | null
    course_component: {
        id?: number
        type?: string
        weight?: number
    }
    course: {
        id?: number
        name?: string
    }
    created_at?: string
}

export interface BatchGradeItem {
    student_id: number
    course_component_id: number
    raw_score: number
    raw_max: number
}

export interface OverridePayload {
    new_score: number
    note: string
}

export const getGrades = () =>
    api.get<ApiResponse<Grade[]>>('/v1/grades')
