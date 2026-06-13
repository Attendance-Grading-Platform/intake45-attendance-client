// src/stores/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials } from '@/types/auth.types'
import type { Role } from '@/constants/roles'
import * as authApi from '@/api/modules/auth.api'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const token = ref<string | null>(localStorage.getItem('token'))
    const isLoggedIn = computed((): boolean => !!token.value)
    const role = computed((): Role | undefined => user.value?.role)

    async function login(credentials: LoginCredentials): Promise<void> {
        // Fetch CSRF cookie to establish session (fixes 419 errors)
        await authApi.getCsrfCookie()

        const res = await authApi.login(credentials)
        // Adjusting to match backend structure: res.data.data.token and res.data.data.user
        token.value = res.data.data.token
        user.value = res.data.data.user
        localStorage.setItem('token', token.value!)
    }
    async function fetchUser(): Promise<void> {
        try {
            const res = await authApi.getMe()
            user.value = res.data.data
        } catch (error) {
            const e = error as { response?: { status?: number } }
            if (e.response?.status === 401) {
                logout()
            }
            throw error
        }
    }

    function logout(): void {
        user.value = null
        token.value = null
        localStorage.removeItem('token')
    }

    return { user, token, isLoggedIn, role, login, fetchUser, logout }
})
