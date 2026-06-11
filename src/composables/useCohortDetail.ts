import { ref } from 'vue'
import { getCohort, closeCohort as closeCohortApi } from '@/api/modules/cohort.api'
import type { CohortDetail } from '@/types/cohort.types'

type ErrorType = 'not_found' | 'forbidden' | 'network' | null

export function useCohortDetail(cohortId: number) {
    const cohort = ref<CohortDetail | null>(null)
    const loading = ref(false)
    const error = ref<ErrorType>(null)

    async function fetchCohort() {
        loading.value = true
        error.value = null
        try {
            const response = await getCohort(cohortId)
            cohort.value = response.data.data
        } catch (err: any) {
            const status = err.response?.status
            if (status === 404) {
                error.value = 'not_found'
            } else if (status === 403) {
                error.value = 'forbidden'
            } else {
                error.value = 'network'
            }
        } finally {
            loading.value = false
        }
    }

    async function closeCohort() {
        if (!cohort.value) return
        await closeCohortApi(cohort.value.id)
        await fetchCohort()
    }

    return { cohort, loading, error, fetchCohort, closeCohort }
}
