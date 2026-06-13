import { ref, computed, type Ref } from 'vue'
import {
    listCourses,
    createCourse as apiCreateCourse,
    createComponent as apiCreateComponent,
    updateComponent as apiUpdateComponent,
    deleteCourse as apiDeleteCourse,
} from '@/api/modules/course.api'
import type { Course, CreateComponentPayload, UpdateComponentPayload } from '@/types/course.types'

export function useCourses(cohortId: Ref<number | null>) {
    const courses = ref<Course[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)

    const allCoursesReady = computed(() =>
        courses.value.length > 0 &&
        courses.value.every(c => c.total_weight === 100)
    )

    async function fetchCourses(): Promise<void> {
        if (!cohortId.value) return

        loading.value = true
        error.value = null

        try {
            const res = await listCourses(cohortId.value)
            courses.value = res.data.data
        } catch (err: unknown) {
            console.error('[useCourses] fetchCourses failed:', err)
            error.value = 'Failed to load courses.'
        } finally {
            loading.value = false
        }
    }

    async function createCourse(name: string, components: CreateComponentPayload[]): Promise<void> {
        if (!cohortId.value) return

        saving.value = true
        error.value = null

        try {
            const res = await apiCreateCourse(cohortId.value, { name })
            const courseId = res.data.data.id

            for (const component of components) {
                if (component.weight > 0) {
                    await apiCreateComponent(courseId, component)
                }
            }

            await fetchCourses()
        } catch (err: unknown) {
            console.error('[useCourses] createCourse failed:', err)
            error.value = 'Failed to create course.'
            throw err
        } finally {
            saving.value = false
        }
    }

    async function updateComponent(id: number, data: UpdateComponentPayload): Promise<void> {
        saving.value = true
        error.value = null

        try {
            await apiUpdateComponent(id, data)
            await fetchCourses()
        } catch (err: unknown) {
            console.error('[useCourses] updateComponent failed:', err)
            error.value = 'Failed to update component.'
            throw err
        } finally {
            saving.value = false
        }
    }

    async function deleteCourse(id: number): Promise<void> {
        saving.value = true
        error.value = null

        try {
            await apiDeleteCourse(id)
            await fetchCourses()
        } catch (err: unknown) {
            console.error('[useCourses] deleteCourse failed:', err)
            error.value = 'Failed to delete course.'
            throw err
        } finally {
            saving.value = false
        }
    }

    return {
        courses,
        loading,
        saving,
        error,
        fetchCourses,
        createCourse,
        updateComponent,
        deleteCourse,
        allCoursesReady,
    }
}
