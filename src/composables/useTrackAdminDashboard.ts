import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { getCohortAnalytics } from '@/api/modules/analytics.api'
import { listCohortEngagements } from '@/api/modules/engagement.api'
import { getSessionAttendance } from '@/api/modules/attendance.api'
import { getEngagementDeliverables } from '@/api/modules/submission.api'
import api from '@/api/axios'
import type { CohortAnalytics } from '@/types/analytics.types'
import type { CohortRow } from '@/types/cohort.types'
import type { Engagement, EngagementSession } from '@/types/engagement.types'

dayjs.extend(isoWeek)

export type AttendanceCellStatus = 'none' | 'attended' | 'missed'

export interface AttendanceGridCell {
    status: AttendanceCellStatus
    label: string
}

export interface GradeBucket {
    label: string
    count: number
    color: string
}

function unwrapData<T>(res: { data: { data?: T } }): T {
    return (res.data.data ?? res.data) as T
}

const GRADE_BUCKET_LABELS = {
    '0–59': 0,
    '60–74': 0,
    '75–89': 0,
    '90–100': 0,
} as const

function bucketGpa(gpa: number): keyof typeof GRADE_BUCKET_LABELS {
    if (gpa >= 90) return '90–100'
    if (gpa >= 75) return '75–89'
    if (gpa >= 60) return '60–74'
    return '0–59'
}

export function useTrackAdminDashboard() {
    const cohorts = ref<CohortRow[]>([])
    const selectedCohortId = ref<number | null>(null)
    const analytics = ref<CohortAnalytics | null>(null)
    const engagements = ref<Engagement[]>([])
    const attendanceGrid = ref<AttendanceGridCell[][]>([])
    const ungradedCount = ref(0)
    const sessionsThisWeek = ref(0)

    const loading = ref(false)
    const error = ref<string | null>(null)

    const selectedCohort = computed(() =>
        cohorts.value.find((cohort) => cohort.id === selectedCohortId.value) ?? null,
    )

    const atRiskCount = computed(() =>
        analytics.value?.students.filter((student) => student.is_at_risk).length ?? 0,
    )

    const enrolledCount = computed(() => analytics.value?.meta.student_count ?? 0)

    const gradeBuckets = computed((): GradeBucket[] => {
        const counts: Record<keyof typeof GRADE_BUCKET_LABELS, number> = {
            '0–59': 0,
            '60–74': 0,
            '75–89': 0,
            '90–100': 0,
        }

        for (const student of analytics.value?.students ?? []) {
            counts[bucketGpa(student.gpa)] += 1
        }

        return [
            { label: '0–59', count: counts['0–59'], color: '#991B1B' },
            { label: '60–74', count: counts['60–74'], color: '#D97706' },
            { label: '75–89', count: counts['75–89'], color: '#940002' },
            { label: '90–100', count: counts['90–100'], color: '#2D6A4F' },
        ]
    })

    const maxBucketCount = computed(() =>
        Math.max(1, ...gradeBuckets.value.map((bucket) => bucket.count)),
    )

    const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

    function weekSessions(): EngagementSession[] {
        const start = dayjs().startOf('isoWeek')
        const end = dayjs().endOf('isoWeek')

        return engagements.value
            .flatMap((engagement) => engagement.sessions ?? [])
            .filter((session) => {
                const date = dayjs(session.session_date)
                return !date.isBefore(start, 'day') && !date.isAfter(end, 'day')
            })
            .sort((a, b) => dayjs(a.session_date).valueOf() - dayjs(b.session_date).valueOf())
    }

    async function buildAttendanceGrid(studentCount: number): Promise<void> {
        const sessions = weekSessions()
        sessionsThisWeek.value = sessions.length

        const grid: AttendanceGridCell[][] = Array.from({ length: 3 }, () =>
            weekDayLabels.map((day) => ({ status: 'none' as AttendanceCellStatus, label: day })),
        )

        const sessionsByDay = new Map<number, EngagementSession[]>()

        for (const session of sessions) {
            const dayIndex = dayjs(session.session_date).isoWeekday() - 1
            if (dayIndex < 0 || dayIndex > 4) continue
            const list = sessionsByDay.get(dayIndex) ?? []
            list.push(session)
            sessionsByDay.set(dayIndex, list)
        }

        const attendanceResults = await Promise.all(
            sessions.map(async (session) => {
                try {
                    const res = await getSessionAttendance(session.id)
                    const records = unwrapData(res).records ?? []
                    const attended = records.filter((record) => record.arrived_at).length
                    const rate = studentCount > 0 ? attended / studentCount : 0
                    return { session, rate }
                } catch {
                    return { session, rate: 0 }
                }
            }),
        )

        const rateBySessionId = new Map(
            attendanceResults.map((result) => [result.session.id, result.rate]),
        )

        for (const [dayIndex, daySessions] of sessionsByDay.entries()) {
            daySessions
                .slice(0, 3)
                .forEach((session, rowIndex) => {
                    const rate = rateBySessionId.get(session.id) ?? 0
                    grid[rowIndex]![dayIndex] = {
                        status: rate >= 0.6 ? 'attended' : 'missed',
                        label: weekDayLabels[dayIndex]!,
                    }
                })
        }

        attendanceGrid.value = grid
    }

    async function countUngradedSubmissions(): Promise<void> {
        let pending = 0

        await Promise.all(
            engagements.value.map(async (engagement) => {
                try {
                    const res = await getEngagementDeliverables(engagement.id)
                    const payload = unwrapData(res)
                    const items = payload.data ?? []
                    pending += items.filter((item) => item.status !== 'graded' && !item.grade).length

                    if (payload.total > items.length) {
                        pending += Math.max(0, payload.total - items.filter((item) => item.grade).length)
                    }
                } catch {
                    // Ignore per-engagement failures on dashboard load
                }
            }),
        )

        ungradedCount.value = pending
    }

    async function loadCohortDashboard(cohortId: number): Promise<void> {
        loading.value = true
        error.value = null

        try {
            const [analyticsRes, engagementList] = await Promise.all([
                getCohortAnalytics(cohortId),
                listCohortEngagements(cohortId),
            ])

            analytics.value = unwrapData(analyticsRes)
            engagements.value = engagementList

            await Promise.all([
                buildAttendanceGrid(analytics.value.meta.student_count),
                countUngradedSubmissions(),
            ])
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            error.value = message ?? 'Failed to load cohort dashboard.'
        } finally {
            loading.value = false
        }
    }

    async function fetchDashboard(): Promise<void> {
        loading.value = true
        error.value = null

        try {
            const res = await api.get('/v1/cohorts')
            cohorts.value = res.data.data ?? []

            if (cohorts.value.length === 0) {
                selectedCohortId.value = null
                analytics.value = null
                return
            }

            if (!selectedCohortId.value) {
                selectedCohortId.value = cohorts.value[0]!.id
            }

            await loadCohortDashboard(selectedCohortId.value)
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            error.value = message ?? 'Failed to load dashboard.'
        } finally {
            loading.value = false
        }
    }

    async function selectCohort(cohortId: number): Promise<void> {
        selectedCohortId.value = cohortId
        await loadCohortDashboard(cohortId)
    }

    return {
        cohorts,
        selectedCohortId,
        selectedCohort,
        analytics,
        loading,
        error,
        enrolledCount,
        sessionsThisWeek,
        ungradedCount,
        atRiskCount,
        gradeBuckets,
        maxBucketCount,
        attendanceGrid,
        weekDayLabels,
        fetchDashboard,
        selectCohort,
    }
}
