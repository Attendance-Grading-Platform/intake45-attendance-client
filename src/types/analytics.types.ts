export interface CohortAnalyticsStudent {
    student_id: number
    name: string
    attendance_rate: number
    gpa: number
    is_at_risk: boolean
}

export interface CohortAnalyticsMeta {
    cohort_id: number
    cohort_name: string
    student_count: number
    total_sessions: number
}

export interface CohortAnalyticsAverages {
    attendance_rate: number
    pass_rate: number
}

export interface CohortAnalytics {
    meta: CohortAnalyticsMeta
    averages: CohortAnalyticsAverages
    students: CohortAnalyticsStudent[]
    track_name?: string
}

export interface BranchSummary {
    totalStudents: number
    totalAtRisk: number
    cohortCount: number
    avgAttendance: number
    avgPassRate: number
}
