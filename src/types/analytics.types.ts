export interface CohortAnalyticsMeta {
    cohort_id: number
    cohort_name: string
    active_tracks?: number
    students_count: number
    at_risk_count: number
    billing_generated?: boolean
    average_grade?: number
    attendance_percentage?: number
}

export interface StudentAnalyticsSummary {
    student_id: number
    name: string
    ledger_balance: number
    gpa: number
    is_at_risk: boolean
    lab_group_name?: string
}

export interface AtRiskResponse {
    cohort_name: string
    at_risk_count: number
    at_risk_students: StudentAnalyticsSummary[]
}

export interface LabGroupAnalytics {
    lab_group_id: number
    lab_group_name: string
    students: StudentAnalyticsSummary[]
}
