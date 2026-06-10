export interface Cohort {
    id: number
    track_id: number
    name: string
    status: 'active' | 'closed'
    started_at: string
    ended_at: string
    created_at: string
    updated_at: string
}
