import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

/* ──────────────────────────────────────────────
 |  Instructor Dashboard API
 |──────────────────────────────────────────────*/

export interface LabGroupItem {
  id: number
  name: string
  track_name: string
}

export interface GradeDistribution {
  Excellent: number
  'Very Good': number
  Good: number
  Pass: number
  Fail: number
}

export interface NextSessionItem {
  id: number
  session_date: string
  start_time: string
  end_time: string
  engagement: {
    type: string
  }
}

export interface InstructorDashboardPayload {
  delivered_hours: number
  lab_groups: LabGroupItem[]
  grade_distribution: GradeDistribution
  next_session?: NextSessionItem
}

export const getInstructorDashboard = () =>
  api.get<ApiResponse<InstructorDashboardPayload>>('/v1/me/instructor-dashboard')
