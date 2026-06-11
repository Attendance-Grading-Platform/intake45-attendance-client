import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
    Course,
    CreateCoursePayload,
    CreateComponentPayload,
    UpdateComponentPayload,
    CourseComponent,
} from '@/types/course.types'

export const listCourses = (cohortId: number) =>
    api.get<ApiResponse<Course[]>>(`/v1/cohorts/${cohortId}/courses`)

export const createCourse = (cohortId: number, data: CreateCoursePayload) =>
    api.post<ApiResponse<Course>>(`/v1/cohorts/${cohortId}/courses`, data)

export const deleteCourse = (courseId: number) =>
    api.delete<ApiResponse<void>>(`/v1/courses/${courseId}`)

export const createComponent = (courseId: number, data: CreateComponentPayload) =>
    api.post<ApiResponse<CourseComponent>>(`/v1/courses/${courseId}/components`, data)

export const updateComponent = (componentId: number, data: UpdateComponentPayload) =>
    api.put<ApiResponse<CourseComponent>>(`/v1/course-components/${componentId}`, data)
