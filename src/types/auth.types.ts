import type { Role } from '@/constants/roles'

export interface User {
    id: number
    name: string
    email: string
    role: Role
    compensation_type: 'internal' | 'external' | null
    expires_at: string
    track_id: number | null
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthResponse {
    user: User
    token: string
}
