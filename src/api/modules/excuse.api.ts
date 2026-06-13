import api from '@/api/axios'
import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api.types'

// ── Response shape from GET /v1/me/excuses & POST /v1/me/excuses ─────────────
export interface ExcuseRequest {
    id: number
    student_id: number
    session_id: number
    /** 'requested' | 'approved' | 'rejected' */
    status: 'requested' | 'approved' | 'rejected'
    reason: string
    /** Relative path, e.g. "excuse-attachments/uuid.pdf" — resolve via getAttachmentUrl() */
    attachment_path?: string | null
    created_at?: string
    reviewed_at?: string | null
    student?: {
        id: number
        name: string
        email?: string
    }
    session?: {
        id: number
        session_date: string
        engagement?: {
            id: number
            type: string
        }
    }
}

// ── Response shape from GET /v1/me/absent-sessions ───────────────────────────
export interface AbsentSession {
    id: number
    session_date: string
    engagement_id?: number
    engagement?: {
        id: number
        type: string
    }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** GET /v1/me/excuses — student's own excuse request history */
export const getExcuses = () =>
    api.get<ApiResponse<ExcuseRequest[]>>('/v1/me/excuses')

/**
 * POST /v1/me/excuses — submit a new excuse request.
 *
 * Required FormData keys (from StoreExcuseRequest.php):
 *   session_id  — integer, must exist in engagement_sessions table
 *   reason      — string, max 2000 chars
 *   attachment  — optional file (pdf|jpg|jpeg|png|gif|webp, max 1 MB)
 *
 * The optional `config` is spread into the Axios call so callers can attach
 * `onUploadProgress` to drive a real-time upload progress bar.
 */
export const createExcuse = (data: FormData, config?: AxiosRequestConfig) =>
    api.post<ApiResponse<ExcuseRequest>>('/v1/me/excuses', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        ...config,
    })

/** GET /v1/me/absent-sessions — sessions eligible for a new excuse */
export const getAbsentSessions = () =>
    api.get<ApiResponse<AbsentSession[]>>('/v1/me/absent-sessions')

export const approveExcuse = (id: number) =>
    api.put<ApiResponse<ExcuseRequest>>(`/v1/excuses/${id}/approve`, { status: 'approved' })

export const rejectExcuse = (id: number) =>
    api.put<ApiResponse<ExcuseRequest>>(`/v1/excuses/${id}/reject`, { status: 'rejected' })