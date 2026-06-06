// src/router/guards.ts
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { Role } from '@/constants/roles'

export function authGuard(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
): void {
    const auth = useAuthStore()

    if (!auth.isLoggedIn) {
        return next({ name: 'login' })
    }

    const requiredRole = to.meta.role as Role | undefined

    if (requiredRole && auth.role !== requiredRole) {
        return next({ name: `${auth.role}-dashboard` })
    }

    next()
}
