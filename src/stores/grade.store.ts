import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Grade } from '@/api/modules/grade.api'
import * as gradeApi from '@/api/modules/grade.api'

export const useGradeStore = defineStore('grade', () => {
    const grades = ref<Grade[]>([])
    const isLoading = ref(false)

    async function fetchGrades() {
        isLoading.value = true
        try {
            const res = await gradeApi.getGrades()
            grades.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    return { grades, isLoading, fetchGrades }
})
