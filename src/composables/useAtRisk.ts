import { ref } from 'vue'
import { getBranchAnalytics, getAtRiskStudents } from '@/api/modules/analytics.api'

export function useAtRisk() {
    const cohorts = ref<any[]>([])
    const selectedCohortId = ref<number | null>(null)
    const atRiskStudents = ref<any[]>([])
    const isLoading = ref(false)
    const errorMsg = ref<string | null>(null)

    const fetchCohortsAndInitialAtRisk = async () => {
        isLoading.value = true
        errorMsg.value = null
        try {
            const res = await getBranchAnalytics()
            cohorts.value = res.data.data || []
            
            if (cohorts.value.length > 0) {
                // Select the first cohort by default
                const firstCohortId = cohorts.value[0].cohort_id
                await selectCohort(firstCohortId)
            }
        } catch (err: any) {
            errorMsg.value = err.response?.data?.message || 'Failed to fetch branch analytics'
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
            atRiskStudents.value = res.data.data?.at_risk_students || []
        } catch (err: any) {
            errorMsg.value = err.response?.data?.message || 'Failed to fetch at-risk students'
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
