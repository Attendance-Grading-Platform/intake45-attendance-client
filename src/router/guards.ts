import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export async function authGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
) {
    const auth = useAuthStore()
    const publicRoutes = ['login', 'forgot-password']

    // load user first
    if (auth.isLoggedIn && !auth.user) {
        try {
            await auth.fetchUser()
        } catch (error) {
            return next({ name: 'login' })
        }
    }

    // if public route
    if (publicRoutes.includes(to.name as string)) {
        if (auth.isLoggedIn && auth.role) {
            return next({ name: `${auth.role.replace('_', '-')}-dashboard` })
        }
        return next()
    }

    // if not logged in -> go to login
    if (!auth.isLoggedIn) {
        return next({ name: 'login' })
    }

    // check role
    const requiredRole = to.meta.role as string | undefined
    if (requiredRole && auth.role !== requiredRole) {
        if (auth.role) {
            return next({ name: `${auth.role.replace('_', '-')}-dashboard` })
        }
        return next({ name: 'login' })
    }

    next()
}
