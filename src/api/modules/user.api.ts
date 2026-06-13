import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { UpdateProfilePayload, UserProfile } from '@/types/profile.types'

export interface UserSummary {
    id: number
    name: string
    email: string
    role: string
}

export const listUsers = (role?: string) =>
    api.get<ApiResponse<UserSummary[]>>('/v1/auth/users', { params: { role } })

export const getUserProfile = (id: number) =>
    api.get<ApiResponse<UserProfile>>(`/v1/auth/users/${id}`)

export const updateProfile = (id: number, data: UpdateProfilePayload) =>
    api.put<ApiResponse<UserProfile>>(`/v1/auth/users/${id}`, data)
