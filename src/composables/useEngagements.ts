import { ref, type Ref } from 'vue'
import {
    listCohortEngagements,
    createEngagement as apiCreate,
    updateEngagement as apiUpdate,
    deleteEngagement as apiDelete,
} from '@/api/modules/engagement.api'
import { listLabGroups } from '@/api/modules/lab-group.api'
import { listUsers } from '@/api/modules/user.api'
import type {
    Engagement,
    LabGroupOption,
    Instructor,
    CreateEngagementPayload,
    UpdateEngagementPayload,
} from '@/types/engagement.types'

function datesOverlap(
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string,
): boolean {
    return aStart <= bEnd && aEnd >= bStart
}

export function useEngagements(cohortId: Ref<number>) {
    const engagements = ref<Engagement[]>([])
    const labGroups = ref<LabGroupOption[]>([])
    const instructors = ref<Instructor[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)

    async function fetchAll(): Promise<void> {
        loading.value = true
        error.value = null

        try {
            const [engagementsData, groupsRes, instructorsRes] = await Promise.all([
                listCohortEngagements(cohortId.value),
                listLabGroups(cohortId.value),
                listUsers('instructor'),
            ])

            engagements.value = engagementsData
            labGroups.value = (groupsRes.data.data ?? []).map(g => ({
                id:            g.id,
                name:          g.name,
                student_count: g.students?.length ?? 0,
            }))
            instructors.value = (instructorsRes.data.data ?? []).map(u => ({
                id:    u.id,
                name:  u.name,
                email: u.email,
            }))
        } catch (err: unknown) {
            console.error('[useEngagements] fetchAll failed:', err)
            error.value = 'Failed to load engagement data.'
        } finally {
            loading.value = false
        }
    }

    async function createEngagement(data: CreateEngagementPayload): Promise<void> {
        saving.value = true
        error.value = null

        try {
            await apiCreate(cohortId.value, data)
            await fetchAll()
        } catch (err: unknown) {
            console.error('[useEngagements] createEngagement failed:', err)
            error.value = 'Failed to create engagement.'
            throw err
        } finally {
            saving.value = false
        }
    }

    async function updateEngagement(id: number, data: UpdateEngagementPayload): Promise<void> {
        saving.value = true
        error.value = null

        try {
            await apiUpdate(id, data)
            await fetchAll()
        } catch (err: unknown) {
            console.error('[useEngagements] updateEngagement failed:', err)
            error.value = 'Failed to update engagement.'
            throw err
        } finally {
            saving.value = false
        }
    }

    async function deleteEngagement(id: number): Promise<void> {
        saving.value = true
        error.value = null

        try {
            await apiDelete(id)
            await fetchAll()
        } catch (err: unknown) {
            console.error('[useEngagements] deleteEngagement failed:', err)
            error.value = 'Failed to delete engagement.'
            throw err
        } finally {
            saving.value = false
        }
    }

    function detectConflicts(
        instructorId: number,
        start: string,
        end: string,
        excludeId?: number,
    ): Engagement[] {
        return engagements.value.filter(e =>
            e.instructor.id === instructorId &&
            e.id !== excludeId &&
            datesOverlap(e.start_date, e.end_date, start, end)
        )
    }

    return {
        engagements,
        labGroups,
        instructors,
        loading,
        saving,
        error,
        fetchAll,
        createEngagement,
        updateEngagement,
        deleteEngagement,
        detectConflicts,
    }
}
