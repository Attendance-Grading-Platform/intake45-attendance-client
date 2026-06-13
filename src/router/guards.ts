import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export async function authGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized
) {
    const auth = useAuthStore()
    const publicRoutes = ['login', 'forgot-password', 'reset-password']

    // load user first
    if (auth.isLoggedIn && !auth.user) {
        try {
            await auth.fetchUser()
        } catch (error) {
            auth.logout()
            return { name: 'login' }
        }
    }

    // if public route
    if (publicRoutes.includes(to.name as string)) {
        if (auth.isLoggedIn && auth.role) {
            return { name: `${auth.role.replace('_', '-')}-dashboard` }
        }
        return true
    }

    // if not logged in -> go to login
    if (!auth.isLoggedIn) {
        return { name: 'login' }
    }

    // check role
    const requiredRole = to.meta.role as string | undefined
    if (requiredRole && auth.role !== requiredRole) {
        if (auth.role) {
            return { name: `${auth.role.replace('_', '-')}-dashboard` }
        }
        return { name: 'login' }
    }

    return true
}
