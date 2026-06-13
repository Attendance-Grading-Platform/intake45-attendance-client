import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface Deliverable {
    id: number;
    course_name: string;
    title: string;
    due_date: string;
    maxPoints: number;
    status: 'pending' | 'submitted' | 'graded';
    grade: number | null;
    feedback: string | null;
    submitted_file: string | null;
}

export const getMyDeliverables = () =>
    api.get<ApiResponse<Deliverable[]>>('/v1/me/deliverables')

export const submitDeliverable = (data: FormData) =>
    api.post<ApiResponse<unknown>>('/v1/me/deliverables', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })