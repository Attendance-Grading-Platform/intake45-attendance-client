import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Grade, BatchGradeItem } from '@/api/modules/grade.api'
import * as gradeApi from '@/api/modules/grade.api'
import api from '@/api/axios'

// Shape returned by GET /api/v1/grades
export interface GradeEntry {
  id?: number
  student_id: number
  student_name?: string
  course_component_id: number
  component_name?: string
  raw_score: number | null
  raw_max: number
  graded_by?: number
  graded_by_name?: string
  overridden_by?: number | null
  original_value?: number | null
  override_note?: string | null
  normalized_score?: number | null
}

// Shape for PATCH /api/v1/grades/{id}/override
export interface OverridePayload {
  new_score: number
  note: string
}

export const useGradeStore = defineStore('grade', () => {
  const grades      = ref<Grade[]>([])
  const isLoading   = ref(false)
  const isSaving    = ref(false)
  const saveError   = ref<string | null>(null)
  const overrideError = ref<string | null>(null)

  // ── Original fetch (unchanged) ─────────────────────────
  async function fetchGrades() {
    isLoading.value = true
    try {
      const res = await gradeApi.getGrades()
      grades.value = res.data.data
    } finally {
      isLoading.value = false
    }
  }

  // ── Instructor: bulk submit scores ────────────────────
  // scores: Record<"studentId_componentId", number | null>
  // Calls POST /api/v1/grades for each non-null cell
  async function submitGrades(
    scores: Record<string, number | null>,
    rawMax: Record<string, number>  // componentId (as string key) → raw_max
  ): Promise<{ success: number; failed: number }> {
    isSaving.value  = true
    saveError.value = null

    let success = 0
    let failed  = 0

    const entries = Object.entries(scores).filter(([, v]) => v !== null)

    for (const [key, raw_score] of entries) {
      const [studentId, componentId] = key.split('_').map(Number)
      const raw_max = rawMax[String(componentId)]
      if (raw_max === undefined || raw_max <= 0) {
        failed++
        continue
      }
      try {
        await api.post('/v1/grades', {
          student_id:          studentId,
          course_component_id: componentId,
          raw_score,
          raw_max,
        })
        success++
      } catch {
        failed++
      }
    }

    // Refresh grades list after bulk submit
    await fetchGrades()

    isSaving.value = false
    if (failed > 0) {
      saveError.value = `${failed} grade(s) failed to save.`
    }
    return { success, failed }
  }

  // ── Batch save: parallel individual POSTs to POST /api/v1/grades ──
  // Replaces the non-existent /v1/grades/batch endpoint.
  // Promise.allSettled fires all requests in parallel; partial failures
  // are counted and surfaced without aborting the remaining saves.
  async function batchSaveGrades(
    items: BatchGradeItem[]
  ): Promise<{ success: number; failed: number }> {
    isSaving.value  = true
    saveError.value = null

    const results = await Promise.allSettled(
      items.map(item =>
        api.post('/v1/grades', {
          student_id:          item.student_id,
          course_component_id: item.course_component_id,
          raw_score:           item.raw_score,
          raw_max:             item.raw_max,
        })
      )
    )

    const success = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.filter(r => r.status === 'rejected').length

    await fetchGrades()

    isSaving.value = false
    if (failed > 0) {
      saveError.value = `${failed} grade(s) failed to save.`
    }

    return { success, failed }
  }

  // ── Track Admin: override a single grade ──────────────
  // Calls PATCH /api/v1/grades/{gradeId}/override
  // Requires: new_score (number), note (string, min 5 chars)
  // Backend saves original_value before overwriting raw_score
  async function overrideGrade(
    gradeId: number,
    payload: OverridePayload
  ): Promise<boolean> {
    overrideError.value = null

    if (!payload.note || payload.note.trim().length < 5) {
      overrideError.value = 'Override note must be at least 5 characters.'
      return false
    }

    try {
      await api.patch(`/v1/grades/${gradeId}/override`, {
        new_score: payload.new_score,
        note:      payload.note.trim(),
      })
      await fetchGrades()
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null
      const axiosMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      overrideError.value =
        axiosMsg ?? msg ?? 'Override failed. Please try again.'
      return false
    }
  }

  // ── Track Admin: fetch grades for a specific cohort ───
  // GET /api/v1/cohorts/{cohortId}/grades
  async function fetchCohortGrades(cohortId: number): Promise<GradeEntry[]> {
    isLoading.value = true
    try {
      const res = await api.get(`/v1/cohorts/${cohortId}/grades`)
      return (res.data.data ?? []).map((g: any) => ({
        id: g.id,
        student_id: g.student_id,
        student_name: g.student?.name || 'Unknown',
        course_component_id: g.course_component_id,
        component_name: g.course_component?.name || g.course_component?.type || 'Unknown Component',
        raw_score: g.raw_score,
        raw_max: g.raw_max,
        graded_by: g.graded_by,
        graded_by_name: g.graded_by_user?.name || null, // Assuming if backend loads it, or we just leave it undefined
        overridden_by: g.overridden_by,
        original_value: g.original_value,
        override_note: g.override_note,
        normalized_score: g.normalized_score
      }))
    } finally {
      isLoading.value = false
    }
  }

  return {
    grades,
    isLoading,
    isSaving,
    saveError,
    overrideError,
    fetchGrades,
    submitGrades,
    batchSaveGrades,
    overrideGrade,
    fetchCohortGrades,
  }
})
