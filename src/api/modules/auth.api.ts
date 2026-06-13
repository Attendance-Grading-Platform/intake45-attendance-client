// src/api/modules/auth.api.ts
import api from '@/api/axios'
import axios from 'axios'
import type { ApiResponse } from '@/types/api.types'
import type { LoginCredentials, AuthResponse } from '@/types/auth.types'

export const getCsrfCookie = () => {
    const apiUrl = (import.meta.env.VITE_API_URL as string) || ''
    return axios.get(`${apiUrl.replace('/api', '')}/sanctum/csrf-cookie`, { withCredentials: true })
}

export const login = (data: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data)

export const logout = () =>
    api.post<ApiResponse<void>>('/v1/auth/logout')

export const getMe = () =>
    api.get<ApiResponse<AuthResponse['user']>>('/v1/auth/me')

export const forgotPassword = (email: string) =>
    api.post<ApiResponse<void>>('/auth/forgot-password', { email })

export const resetPassword = (data: Record<string, string>) =>
    api.post<ApiResponse<void>>('/auth/reset-password', data)
