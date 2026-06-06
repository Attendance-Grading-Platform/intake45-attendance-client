// src/api/modules/grade.api.ts
import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Grade, GradeOverride } from '@/types/grade.types'

export const getMyGrades = () =>
    api.get<ApiResponse<Grade[]>>('/my/grades')

export const storeGrade = (data: { student_id: number; raw_score: number; raw_max: number }) =>
    api.post<ApiResponse<Grade>>('/grades', data)

export const overrideGrade = (id: number, data: { new_value: number; override_note: string }) =>
    api.post<ApiResponse<GradeOverride>>(`/grades/${id}/override`, data)
