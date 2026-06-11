import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Cohort } from '@/types/cohort.types'
import * as cohortApi from '@/api/modules/cohort.api'

export const useCohortStore = defineStore('cohort', () => {
    const cohorts = ref<Cohort[]>([])
    const students = ref<any[]>([])
    const isLoading = ref(false)

    async function fetchCohorts() {
        isLoading.value = true
        try {
            const res = await cohortApi.getCohorts()
            cohorts.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    async function fetchCohortStudents(cohortId: number) {
        isLoading.value = true
        try {
            const res = await cohortApi.getCohortStudents(cohortId)
            students.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    return { cohorts, students, isLoading, fetchCohorts, fetchCohortStudents }
})
