// src/api/modules/auth.api.ts
import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { LoginCredentials, AuthResponse } from '@/types/auth.types'

export const login = (data: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data)

export const logout = () =>
    api.post<ApiResponse<void>>('/auth/logout')

export const getMe = () =>
    api.get<ApiResponse<AuthResponse['user']>>('/auth/me')
