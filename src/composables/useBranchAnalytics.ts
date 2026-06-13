import { ref, computed } from 'vue'
import { getBranchAnalytics } from '@/api/modules/analytics.api'
import { listCohorts } from '@/api/modules/cohort.api'
import type { BranchSummary, CohortAnalytics, CohortAnalyticsStudent } from '@/types/analytics.types'

function unwrapData<T>(res: { data: { data?: T } }): T {
    return (res.data.data ?? res.data) as T
}

export function atRiskReasons(student: CohortAnalyticsStudent): string[] {
    const reasons: string[] = []
    if (student.attendance_rate < 85) reasons.push('Attendance below 85%')
    if (student.gpa < 60) reasons.push('GPA below 60')
    return reasons
}

export function useBranchAnalytics() {
    const cohortAnalytics = ref<CohortAnalytics[]>([])
    const selectedCohortId = ref<number | null>(null)
    const trackFilter = ref<string>('all')
    const showAtRiskOnly = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const branchSummary = computed((): BranchSummary => {
        const items = cohortAnalytics.value
        const totalStudents = items.reduce((sum, c) => sum + c.meta.student_count, 0)
        const totalAtRisk = items.reduce(
            (sum, c) => sum + c.students.filter((s) => s.is_at_risk).length,
            0,
        )

        let attendanceWeighted = 0
        let passWeighted = 0
        for (const c of items) {
            attendanceWeighted += c.averages.attendance_rate * c.meta.student_count
            passWeighted += c.averages.pass_rate * c.meta.student_count
        }

        return {
            totalStudents,
            totalAtRisk,
            cohortCount: items.length,
            avgAttendance: totalStudents > 0 ? Math.round((attendanceWeighted / totalStudents) * 10) / 10 : 0,
            avgPassRate: totalStudents > 0 ? Math.round((passWeighted / totalStudents) * 10) / 10 : 0,
        }
    })

    const trackNames = computed(() =>
        [...new Set(cohortAnalytics.value.map((c) => c.track_name).filter(Boolean))] as string[],
    )

    const filteredCohorts = computed(() => {
        if (trackFilter.value === 'all') return cohortAnalytics.value
        return cohortAnalytics.value.filter((c) => c.track_name === trackFilter.value)
    })

    const selectedCohort = computed(() =>
        cohortAnalytics.value.find((c) => c.meta.cohort_id === selectedCohortId.value) ?? null,
    )

    const drillDownStudents = computed((): CohortAnalyticsStudent[] => {
        const students = selectedCohort.value?.students ?? []
        const list = showAtRiskOnly.value ? students.filter((s) => s.is_at_risk) : students
        return [...list].sort((a, b) => {
            if (a.is_at_risk !== b.is_at_risk) return a.is_at_risk ? -1 : 1
            return a.name.localeCompare(b.name)
        })
    })

    const cohortSelectOptions = computed(() =>
        cohortAnalytics.value.map((c) => ({
            label: c.track_name ? `${c.meta.cohort_name} · ${c.track_name}` : c.meta.cohort_name,
            value: c.meta.cohort_id,
        })),
    )

    function atRiskCount(cohort: CohortAnalytics): number {
        return cohort.students.filter((s) => s.is_at_risk).length
    }

    async function fetchBranchAnalytics(): Promise<void> {
        loading.value = true
        error.value = null

        try {
            const [analyticsRes, cohortsRes] = await Promise.all([
                getBranchAnalytics(),
                listCohorts(),
            ])

            const analytics = unwrapData<CohortAnalytics[]>(analyticsRes)
            const cohortRows = unwrapData<Array<{ id: number; track?: { name: string } }>>(cohortsRes)
            const trackById = new Map(cohortRows.map((c) => [c.id, c.track?.name ?? 'Unknown track']))

            cohortAnalytics.value = analytics.map((item) => ({
                ...item,
                track_name: trackById.get(item.meta.cohort_id),
            }))

            if (cohortAnalytics.value.length > 0 && !selectedCohortId.value) {
                selectedCohortId.value = cohortAnalytics.value[0]!.meta.cohort_id
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            error.value = message ?? 'Failed to load branch analytics.'
        } finally {
            loading.value = false
        }
    }

    function selectCohort(cohortId: number): void {
        selectedCohortId.value = cohortId
        showAtRiskOnly.value = false
    }

    return {
        cohortAnalytics,
        selectedCohortId,
        trackFilter,
        showAtRiskOnly,
        loading,
        error,
        branchSummary,
        trackNames,
        filteredCohorts,
        selectedCohort,
        drillDownStudents,
        cohortSelectOptions,
        atRiskCount,
        fetchBranchAnalytics,
        selectCohort,
    }
}
