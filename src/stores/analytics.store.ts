import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as analyticsApi from '@/api/modules/analytics.api'

interface StudentAnalytics {
    student_id: number
    name: string
    ledger_balance: number
    gpa: number
    is_at_risk: boolean
    attendance_rate?: number
}

interface CohortAnalyticsData {
    students?: StudentAnalytics[]
    meta?: {
        cohort_id?: number
        cohort_name?: string
        students_count?: number
        at_risk_count?: number
    }
    [key: string]: unknown
}

export const useAnalyticsStore = defineStore('analytics', () => {
    const cohortAnalytics = ref<CohortAnalyticsData | null>(null)
    const isLoading = ref(false)

    async function fetchCohortAnalytics(cohortId: number) {
        isLoading.value = true
        try {
            const res = await analyticsApi.getCohortAnalytics(cohortId)
            cohortAnalytics.value = res.data.data as CohortAnalyticsData
        } finally {
            isLoading.value = false
        }
    }

    return { cohortAnalytics, isLoading, fetchCohortAnalytics }
})
