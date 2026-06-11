import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Grade {
    id: number;
    student_id: number;
    raw_score: number;
    raw_max: number;
    normalized_score: number;
    final_score: number;
    course_component: {
        id?: number;
        type?: string;
        weight?: number;
    };
    course: {
        id?: number;
        name?: string;
    };
    created_at?: string;
}

export const getGrades = () =>
    api.get<ApiResponse<Grade[]>>('/v1/grades')

export const getMyGrades = () =>
    api.get<ApiResponse<Grade[]>>('/v1/me/grades')
