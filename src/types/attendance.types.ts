export type AttendanceStatus = 'present' | 'unexcused' | 'excused'

export interface AttendanceRecord {
    id: number
    student_id: number
    session_id: number
    scan_in_at: string | null
    scan_out_at: string | null
    status: AttendanceStatus
}

export interface AttendanceLedger {
    student_id: number
    balance: number
}

export interface LedgerTransaction {
    id: number
    type: 'unexcused' | 'excused'
    deduction: -25 | -5
    session_id: number
    created_at: string
}
