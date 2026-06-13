export interface Announcement {
    id: number
    cohort_id: number
    author_id: number
    title: string
    body: string
    published_at: string
    created_at: string
    updated_at: string
    author?: {
        id: number
        name: string
        role: string
    }
}
