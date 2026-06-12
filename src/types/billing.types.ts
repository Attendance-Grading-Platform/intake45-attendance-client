export interface BillingEntry {
    id: number
    user_id: number
    name: string
    compensation_type: 'internal' | 'external'
    delivered_hours: number
    hourly_rate: number
    fixed_salary: number
    hourly_component: number
    total_amount: number
}

export interface BillingRollup {
    id: number
    cohort_id: number
    cohort_name: string
    generated_at: string
    total_internal_hours: number
    total_external_hours: number
    total_cost: number
    cost_per_student: number
    students_count: number
    entries: BillingEntry[]
}

export interface CohortOption {
    id: number
    name: string
    status: 'active' | 'closed'
    track: { name: string }
}
