import { ref } from 'vue'
import { getBranchAnalytics, getAtRiskStudents } from '@/api/modules/analytics.api'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'

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
            const authStore = useAuthStore()
            
            if (authStore.user?.role === 'branch_manager') {
                const res = await getBranchAnalytics()
                const data = res.data.data || []
                cohorts.value = data.map((item: any) => ({
                    cohort_id: item.meta?.cohort_id || item.cohort_id,
                    cohort_name: item.meta?.cohort_name || item.cohort_name
                }))
            } else {
                // track_admin or other
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
