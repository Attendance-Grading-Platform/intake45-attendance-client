import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import * as userApi from '@/api/modules/user.api'
import * as cohortApi from '@/api/modules/cohort.api'
import * as labGroupApi from '@/api/modules/lab-group.api'
import type { ProfileContext, ProfileLabGroup, UserProfile } from '@/types/profile.types'
import { ROLES } from '@/constants/roles'

function unwrapData<T>(res: { data: { data?: T } & T }): T {
    return (res.data.data ?? res.data) as T
}

export function useProfile() {
    const auth = useAuthStore()
    const profile = ref<UserProfile | null>(null)
    const context = ref<ProfileContext>({ cohorts: [], labGroups: [] })
    const isLoading = ref(false)
    const isSaving = ref(false)
    const error = ref<string | null>(null)
    const saveMessage = ref('')

    const isExpired = computed(() => {
        if (!profile.value?.expiry_date) return false
        const expiry = new Date(profile.value.expiry_date)
        expiry.setHours(23, 59, 59, 999)
        return expiry < new Date()
    })

    const isAccountActive = computed(() => profile.value?.is_active !== false && !isExpired.value)

    async function loadLabGroupsForInstructor(userId: number, cohorts: ProfileContext['cohorts']): Promise<ProfileLabGroup[]> {
        const groups: ProfileLabGroup[] = []

        for (const cohort of cohorts) {
            try {
                const res = await labGroupApi.listLabGroups(cohort.id)
                const labGroups = unwrapData(res.data) as Array<{
                    id: number
                    name: string
                    instructor: { id: number } | null
                    students: unknown[]
                }>

                for (const group of labGroups) {
                    if (group.instructor?.id === userId) {
                        groups.push({
                            id: group.id,
                            name: group.name,
                            cohortName: cohort.name,
                            studentCount: group.students?.length ?? 0,
                        })
                    }
                }
            } catch {
                // Instructor may not have lab-group access on every cohort
            }
        }

        return groups
    }

    async function findStudentLabGroup(userId: number, cohortId: number, cohortName: string): Promise<ProfileLabGroup | null> {
        try {
            const res = await cohortApi.getCohortStudents(cohortId)
            const students = unwrapData(res.data) as Array<{
                id: number
                enrolled_lab_groups?: Array<{ id: number; name: string }>
            }>
            const me = students.find((s) => s.id === userId)
            const labGroup = me?.enrolled_lab_groups?.[0]
            if (!labGroup) return null

            return {
                id: labGroup.id,
                name: labGroup.name,
                cohortName,
                studentCount: 0,
            }
        } catch {
            return null
        }
    }

    async function enrichContext(userId: number, role: string): Promise<ProfileContext> {
        const cohortRes = await cohortApi.getCohorts()
        const rawCohorts = unwrapData(cohortRes.data) as Array<{
            id: number
            name: string
            status?: string
            track?: { id: number; name: string }
        }>

        const cohorts = rawCohorts.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            track: c.track,
        }))

        let labGroups: ProfileLabGroup[] = []

        if (role === ROLES.INSTRUCTOR) {
            labGroups = await loadLabGroupsForInstructor(userId, cohorts)
        } else if (role === ROLES.STUDENT && cohorts[0]) {
            const group = await findStudentLabGroup(userId, cohorts[0].id, cohorts[0].name)
            if (group) labGroups = [group]
        }

        return { cohorts, labGroups }
    }

    async function fetchProfile(): Promise<void> {
        if (!auth.user?.id) return

        isLoading.value = true
        error.value = null

        try {
            const res = await userApi.getUserProfile(auth.user.id)
            const data = unwrapData(res.data)
            profile.value = data

            const ctx = await enrichContext(data.id, data.role)
            context.value = ctx

            if (data.role === ROLES.TRACK_ADMIN) {
                profile.value.administered_cohorts = ctx.cohorts
            } else if (data.role === ROLES.STUDENT) {
                profile.value.enrolled_cohorts = ctx.cohorts
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            error.value = message ?? 'Failed to load your profile.'
        } finally {
            isLoading.value = false
        }
    }

    async function saveProfile(payload: { name: string; email: string; password?: string }): Promise<boolean> {
        if (!profile.value) return false

        saveMessage.value = ''
        error.value = null
        isSaving.value = true

        try {
            const body: { name: string; email: string; password?: string } = {
                name: payload.name,
                email: payload.email,
            }
            if (payload.password) body.password = payload.password

            const res = await userApi.updateProfile(profile.value.id, body)
            const updated = unwrapData(res.data)

            profile.value = { ...profile.value, ...updated }
            if (auth.user) {
                auth.user = { ...auth.user, name: updated.name, email: updated.email }
            }

            saveMessage.value = 'Profile updated successfully.'
            setTimeout(() => { saveMessage.value = '' }, 3000)
            return true
        } catch (err: unknown) {
            const resp = (err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } })?.response
            if (resp?.status === 422 && resp.data?.errors) {
                const first = Object.values(resp.data.errors)[0]?.[0]
                error.value = first ?? 'Validation failed.'
            } else {
                error.value = resp?.data?.message ?? 'Failed to update profile.'
            }
            return false
        } finally {
            isSaving.value = false
        }
    }

    return {
        profile,
        context,
        isLoading,
        isSaving,
        error,
        saveMessage,
        isExpired,
        isAccountActive,
        fetchProfile,
        saveProfile,
    }
}
