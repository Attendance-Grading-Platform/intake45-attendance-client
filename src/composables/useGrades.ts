// src/composables/useGrades.ts
import { ref } from 'vue'
import * as gradeApi from '@/api/modules/grade.api'

export function useGrades() {
    const grades = ref<unknown[]>([])
    const loading = ref<boolean>(false)
    const error = ref<string | null>(null)

    async function fetchGrades(): Promise<void> {
        loading.value = true
        error.value = null
        try {
            const res = await gradeApi.getMyGrades()
            grades.value = res.data.data
        } catch (e: unknown) {
            if (e instanceof Error) error.value = e.message
            else error.value = 'Something went wrong'
        } finally {
            loading.value = false
        }
    }

    return { grades, loading, error, fetchGrades }
}
