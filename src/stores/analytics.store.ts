import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as analyticsApi from '@/api/modules/analytics.api'

export const useAnalyticsStore = defineStore('analytics', () => {
    const cohortAnalytics = ref<any>(null)
    const isLoading = ref(false)

    async function fetchCohortAnalytics(cohortId: number) {
        isLoading.value = true
        try {
            const res = await analyticsApi.getCohortAnalytics(cohortId)
            cohortAnalytics.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    return { cohortAnalytics, isLoading, fetchCohortAnalytics }
})
