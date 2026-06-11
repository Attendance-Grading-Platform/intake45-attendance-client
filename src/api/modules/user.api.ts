import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

export interface UserSummary {
    id: number
    name: string
    email: string
    role: string
}

export const listUsers = (role?: string) =>
    api.get<ApiResponse<UserSummary[]>>('/v1/auth/users', { params: { role } })
