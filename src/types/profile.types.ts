import type { Role } from '@/constants/roles'

export interface ProfileCohort {
    id: number
    name: string
    track?: { id: number; name: string }
    status?: string
}

export interface ProfileLabGroup {
    id: number
    name: string
    cohortName: string
    studentCount: number
}

export interface UserProfile {
    id: number
    name: string
    email: string
    role: Role
    is_active?: boolean
    expiry_date?: string | null
    compensation_type?: 'internal' | 'external' | null
    hourly_rate?: number | null
    fixed_salary?: number | null
    enrolled_cohorts?: ProfileCohort[]
    administered_cohorts?: ProfileCohort[]
}

export interface ProfileContext {
    cohorts: ProfileCohort[]
    labGroups: ProfileLabGroup[]
}

export interface UpdateProfilePayload {
    name?: string
    email?: string
    password?: string
}
