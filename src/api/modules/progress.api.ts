import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'

/* ──────────────────────────────────────────────
 |  Student Progress API — Screen 22
 |──────────────────────────────────────────────*/

export interface ScoreProgression {
  month: string
  average: number
}

export interface AttendanceTrend {
  week: string
  present: number
  missed: number
}

export interface LedgerHistory {
  date: string
  balance: number
  description: string
}

export interface CourseBreakdown {
  course_name: string
  percentage: number
}

export interface SessionRecord {
  date: string
  type: string
  status: 'present' | 'late' | 'absent'
}

export interface StudentProgressPayload {
  score_progression: ScoreProgression[]
  attendance_trend: AttendanceTrend[]
  ledger_history: LedgerHistory[]
  course_breakdown: CourseBreakdown[]
  session_record: SessionRecord[]
  final_index: number
}

export const getStudentProgress = () =>
  api.get<ApiResponse<StudentProgressPayload>>('/v1/me/progress')
