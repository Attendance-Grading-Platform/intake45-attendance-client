import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface ExcuseRequest {
    id: number;
    student_id: number;
    session_id: number;
    status: 'requested' | 'approved' | 'rejected';
    reason: string;
    attachment_path?: string;
    created_at?: string;
    student?: {
        id: number;
        name: string;
        email: string;
        enrolled_lab_groups?: { id: number; name: string }[];
    };
    session?: {
        id: number;
        session_date: string;
        engagement?: {
            id: number;
            type: string;
        };
    };
}

export const getExcuses = () =>
    api.get<ApiResponse<ExcuseRequest[]>>('/v1/excuses')

export const createExcuse = (data: FormData) =>
    api.post<ApiResponse<ExcuseRequest>>('/v1/excuses', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

export const approveExcuse = (id: number) =>
    api.put<ApiResponse<ExcuseRequest>>(`/v1/excuses/${id}/approve`, { status: 'approved' })

export const rejectExcuse = (id: number) =>
    api.put<ApiResponse<ExcuseRequest>>(`/v1/excuses/${id}/reject`, { status: 'rejected' })

export const getAbsentSessions = () =>
    api.get<ApiResponse<unknown[]>>('/v1/me/absent-sessions')