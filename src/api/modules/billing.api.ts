import api from '../axios'
import type { ApiResponse } from '@/types/api.types'
import type { BillingRollup, BillingEntry } from '@/types/billing.types'

export const billingApi = {
    /**
     * Get billing rollup for a cohort
     * 404 means rollup not yet generated
     */
    getRollup(cohortId?: number) {
        return api.get<ApiResponse<BillingRollup>>(`/v1/billing/rollup`, {
            params: cohortId ? { cohort_id: cohortId } : undefined,
        })
    },

    /**
     * Generate billing rollup for a cohort
     */
    generateRollup(cohortId: number) {
        return api.post<ApiResponse<BillingRollup>>(`/v1/billing/rollup/generate`, {
            cohort_id: cohortId
        })
    },

    /**
     * Get instructor detail breakdown
     */
    getInstructorDetail(userId: number, cohortId: number) {
        return api.get(`/v1/billing/instructors/${userId}`, {
            params: { cohort_id: cohortId }
        })
    }
}
