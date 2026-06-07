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

    const publicRoutes = ['login', 'forgot-password']

    if (publicRoutes.includes(to.name as string)) {
        if (auth.isLoggedIn && auth.role) {
            return next({ name: `${auth.role.replace('_', '-')}-dashboard` })
        }
        return next()
    }

    if (!auth.isLoggedIn) {
        return next({ name: 'login' })
    }

    const requiredRole = to.meta.role as Role | undefined

    if (requiredRole && auth.role !== requiredRole) {
        if (auth.role) {
            return next({ name: `${auth.role.replace('_', '-')}-dashboard` })
        }
        return next({ name: 'login' })
    }

    next()
}
