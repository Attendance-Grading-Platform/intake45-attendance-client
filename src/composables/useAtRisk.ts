import { ref } from 'vue'
import { getBranchAnalytics, getAtRiskStudents } from '@/api/modules/analytics.api'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'

interface CohortSummary {
    cohort_id: number
    cohort_name: string
}

export function useAtRisk() {
    const cohorts = ref<CohortSummary[]>([])
    const selectedCohortId = ref<number | null>(null)
    const atRiskStudents = ref<unknown[]>([])
    const isLoading = ref(false)
    const errorMsg = ref<string | null>(null)

    const fetchCohortsAndInitialAtRisk = async () => {
        isLoading.value = true
        errorMsg.value = null
        try {
            const authStore = useAuthStore()

            if (authStore.user?.role === 'branch_manager') {
                const res = await getBranchAnalytics()
                const data = (res.data.data ?? []) as Array<Record<string, Record<string, unknown>>>
                cohorts.value = data.map((item) => ({
                    cohort_id: (item.meta?.cohort_id ?? item.cohort_id ?? 0) as number,
                    cohort_name: (item.meta?.cohort_name ?? item.cohort_name ?? '') as string,
                }))
            } else {
                const cohortStore = useCohortStore()
                if (cohortStore.cohorts.length === 0) {
                    await cohortStore.fetchCohorts()
                }
                cohorts.value = cohortStore.cohorts.map(c => ({
                    cohort_id: c.id,
                    cohort_name: c.name
                }))
            }

            if (cohorts.value.length > 0) {
                const firstCohortId = cohorts.value[0]?.cohort_id
                if (firstCohortId !== undefined) {
                    await selectCohort(firstCohortId)
                }
            }
        } catch (err) {
            errorMsg.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch branch analytics'
            console.error('Fetch branch analytics error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const selectCohort = async (cohortId: number) => {
        selectedCohortId.value = cohortId
        isLoading.value = true
        errorMsg.value = null

        try {
            const res = await getAtRiskStudents(cohortId)
            const data = res.data.data as { at_risk_students?: unknown[] } | null
            atRiskStudents.value = data?.at_risk_students ?? []
        } catch (err) {
            errorMsg.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch at-risk students'
            console.error('Fetch at-risk students error:', err)
        } finally {
            isLoading.value = false
        }
    }

    return {
        cohorts,
        selectedCohortId,
        atRiskStudents,
        isLoading,
        errorMsg,
        fetchCohortsAndInitialAtRisk,
        selectCohort
    }
}
