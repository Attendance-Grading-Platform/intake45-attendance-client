export type ExcuseStatus = 'requested' | 'approved' | 'rejected'

export interface Excuse {
    id: number
    student_id: number
    session_id: number
    reason: string
    attachment_path: string | null
    status: ExcuseStatus
    reviewed_by: number | null
    reviewed_at: string | null
}
