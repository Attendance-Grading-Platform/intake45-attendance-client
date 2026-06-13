import { ref, computed } from 'vue'
import { useBranchAnalytics } from '@/composables/useBranchAnalytics'
import { useTracks } from '@/composables/useTracks'
import { billingApi } from '@/api/modules/billing.api'
import type { CohortAnalyticsStudent } from '@/types/analytics.types'

interface BillingSnapshotRow {
    id: number
    person_id: number
    name: string
    compensation_type: 'internal' | 'external'
    delivered_hours: number
    total_amount: number
    cohort_name: string
}

function unwrapData<T>(res: { data: { data?: T } }): T {
    return (res.data.data ?? res.data) as T
}

export function useBranchDashboard() {
    const {
        cohortAnalytics,
        branchSummary,
        loading: analyticsLoading,
        error: analyticsError,
        fetchBranchAnalytics,
    } = useBranchAnalytics()

    const { tracks, loading: tracksLoading, fetchTracks } = useTracks()

    const billingLoading = ref(false)
    const billingError = ref<string | null>(null)
    const pendingBillingHours = ref(0)
    const billingRows = ref<BillingSnapshotRow[]>([])

    const loading = computed(() => analyticsLoading.value || tracksLoading.value || billingLoading.value)
    const error = computed(() => analyticsError.value ?? billingError.value)

    const activeTracksCount = computed(() =>
        tracks.value.filter((track) => track.active_cohort !== null).length,
    )

    const trackPerformance = computed(() => {
        const byTrack = new Map<string, { attendance: number; passRate: number; students: number }>()

        for (const cohort of cohortAnalytics.value) {
            const trackName = cohort.track_name ?? 'Unknown track'
            const existing = byTrack.get(trackName) ?? { attendance: 0, passRate: 0, students: 0 }
            const weight = cohort.meta.student_count

            existing.attendance += cohort.averages.attendance_rate * weight
            existing.passRate += cohort.averages.pass_rate * weight
            existing.students += weight
            byTrack.set(trackName, existing)
        }

        return [...byTrack.entries()]
            .map(([trackName, totals]) => ({
                trackName,
                attendanceRate: totals.students > 0
                    ? Math.round((totals.attendance / totals.students) * 10) / 10
                    : 0,
                passRate: totals.students > 0
                    ? Math.round((totals.passRate / totals.students) * 10) / 10
                    : 0,
            }))
            .sort((a, b) => b.passRate - a.passRate)
    })

    const atRiskStudents = computed((): Array<CohortAnalyticsStudent & { cohort_name: string }> => {
        const rows: Array<CohortAnalyticsStudent & { cohort_name: string }> = []

        for (const cohort of cohortAnalytics.value) {
            for (const student of cohort.students) {
                if (student.is_at_risk) {
                    rows.push({
                        ...student,
                        cohort_name: cohort.meta.cohort_name,
                    })
                }
            }
        }

        return rows.sort((a, b) => a.name.localeCompare(b.name))
    })

    const billingTotals = computed(() => {
        const internal = billingRows.value.filter((row) => row.compensation_type === 'internal')
        const external = billingRows.value.filter((row) => row.compensation_type === 'external')

        return {
            internalHours: internal.reduce((sum, row) => sum + row.delivered_hours, 0),
            externalHours: external.reduce((sum, row) => sum + row.delivered_hours, 0),
            internalAmount: internal.reduce((sum, row) => sum + row.total_amount, 0),
            externalAmount: external.reduce((sum, row) => sum + row.total_amount, 0),
            grandTotal: billingRows.value.reduce((sum, row) => sum + row.total_amount, 0),
        }
    })

    async function fetchBillingRollup(): Promise<void> {
        billingLoading.value = true
        billingError.value = null

        try {
            const res = await billingApi.getRollup()
            const payload = (res.data.data ?? res.data) as unknown as {
                summary: { total_delivered_hours: number }
                snapshots: Array<{
                    id: number
                    person_id: number
                    compensation_type: 'internal' | 'external'
                    delivered_hours: number | string
                    total_amount: number | string
                    person?: { name: string }
                    cohort?: { name: string }
                }>
            }

            pendingBillingHours.value = Number(payload.summary?.total_delivered_hours ?? 0)

            const latestByPerson = new Map<number, BillingSnapshotRow>()

            for (const snapshot of payload.snapshots ?? []) {
                const existing = latestByPerson.get(snapshot.person_id)
                const row: BillingSnapshotRow = {
                    id: snapshot.id,
                    person_id: snapshot.person_id,
                    name: snapshot.person?.name ?? 'Unknown',
                    compensation_type: snapshot.compensation_type,
                    delivered_hours: Number(snapshot.delivered_hours ?? 0),
                    total_amount: Number(snapshot.total_amount ?? 0),
                    cohort_name: snapshot.cohort?.name ?? '—',
                }

                if (!existing || row.id > existing.id) {
                    latestByPerson.set(snapshot.person_id, row)
                }
            }

            billingRows.value = [...latestByPerson.values()].sort((a, b) => a.name.localeCompare(b.name))
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            billingError.value = message ?? 'Failed to load billing rollup.'
        } finally {
            billingLoading.value = false
        }
    }

    async function fetchDashboard(): Promise<void> {
        await Promise.all([
            fetchBranchAnalytics(),
            fetchTracks(),
            fetchBillingRollup(),
        ])
    }

    function exportBillingCsv(): void {
        if (billingRows.value.length === 0) return

        const headers = ['Instructor', 'Type', 'Cohort', 'Hours', 'Total Amount']
        const rows = billingRows.value.map((row) => [
            row.name,
            row.compensation_type,
            row.cohort_name,
            row.delivered_hours.toFixed(1),
            row.total_amount.toFixed(2),
        ])

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.map((value) => `"${value}"`).join(',')),
            '',
            `"Grand Total","","","${billingTotals.value.internalHours + billingTotals.value.externalHours}","${billingTotals.value.grandTotal.toFixed(2)}"`,
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'billing_rollup.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return {
        loading,
        error,
        branchSummary,
        activeTracksCount,
        pendingBillingHours,
        trackPerformance,
        atRiskStudents,
        billingRows,
        billingTotals,
        fetchDashboard,
        exportBillingCsv,
    }
}
