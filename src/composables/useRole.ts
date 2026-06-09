import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES, type Role } from '@/constants/roles'

export function useRole() {
    const auth = useAuthStore()

    const role = computed((): Role | undefined => auth.role)

    const isBranchManager = computed(() => auth.role === ROLES.BRANCH_MANAGER)
    const isTrackAdmin    = computed(() => auth.role === ROLES.TRACK_ADMIN)
    const isInstructor    = computed(() => auth.role === ROLES.INSTRUCTOR)
    const isStudent       = computed(() => auth.role === ROLES.STUDENT)

    // check if the user role matches any role in list
    function hasRole(...roles: Role[]): boolean {
        return !!auth.role && roles.includes(auth.role)
    }

    // get the dashboard for current user
    const dashboardRoute = computed((): string => {
        if (!auth.role) return 'login'
        return `${auth.role.replace('_', '-')}-dashboard`
    })

    return {
        role,
        isBranchManager,
        isTrackAdmin,
        isInstructor,
        isStudent,
        hasRole,
        dashboardRoute,
    }
}