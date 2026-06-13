import { ref } from 'vue'
import type { AxiosProgressEvent } from 'axios'
import {
    getExcuses,
    getAbsentSessions,
    createExcuse,
    type ExcuseRequest,
    type AbsentSession,
} from '@/api/modules/excuse.api'

/**
 * Encapsulates all state and actions for the "My Excuses" page.
 *
 * Endpoints (all scoped to the authenticated student via /v1/me/…):
 *   GET  /v1/me/excuses          — history list
 *   POST /v1/me/excuses          — submit new excuse
 *   GET  /v1/me/absent-sessions  — sessions eligible for an excuse
 *
 * FormData keys (from StoreExcuseRequest.php):
 *   session_id  — integer
 *   reason      — string (max 2000)
 *   attachment  — optional file (pdf|jpg|jpeg|png|gif|webp, max 1 MB)
 */
export function useExcuses() {
    // ── List state ───────────────────────────────────────────────────────────
    const excuses = ref<ExcuseRequest[]>([])
    const absentSessions = ref<AbsentSession[]>([])
    const isLoading = ref(false)

    // ── Submission state ─────────────────────────────────────────────────────
    const isSubmitting = ref(false)
    const uploadProgress = ref(0)
    const errorMsg = ref('')
    const successMsg = ref('')

    // ────────────────────────────────────────────────────────────────────────

    /** Loads the student's excuse request history. */
    const fetchExcuses = async () => {
        isLoading.value = true
        errorMsg.value = ''
        try {
            const { data } = await getExcuses()
            excuses.value = data.data ?? []
        } catch (err) {
            errorMsg.value = 'Failed to load your excuse request history. Please refresh the page.'
            console.error('[useExcuses] fetchExcuses failed:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Loads sessions the student is eligible to excuse.
     * Uses GET /v1/me/absent-sessions — backend already filters out sessions
     * that have a pending/approved excuse, so no frontend filtering needed.
     */
    const fetchAbsentSessions = async () => {
        try {
            const { data } = await getAbsentSessions()
            absentSessions.value = data.data ?? []
        } catch (err) {
            console.error('[useExcuses] fetchAbsentSessions failed:', err)
            absentSessions.value = []
        }
    }

    /**
     * Submits a new excuse request.
     *
     * FormData keys match StoreExcuseRequest.php exactly:
     *   session_id | reason | attachment (optional)
     *
     * On success: prepends the new record to `excuses` for instant UI update,
     *   then refreshes absentSessions (used session is no longer eligible).
     * On failure: sets errorMsg and re-throws so the form can decide whether
     *   to clear itself (it should NOT clear on failure so the user can retry).
     */
    const submitExcuse = async (sessionId: number, reason: string, file: File | null) => {
        isSubmitting.value = true
        uploadProgress.value = 0
        errorMsg.value = ''
        successMsg.value = ''

        const formData = new FormData()
        formData.append('session_id', String(sessionId))   // ← exact key from StoreExcuseRequest
        formData.append('reason', reason)                   // ← exact key from StoreExcuseRequest
        if (file) {
            formData.append('attachment', file)             // ← exact key from StoreExcuseRequest
        }

        try {
            const { data } = await createExcuse(formData, {
                onUploadProgress: (e: AxiosProgressEvent) => {
                    uploadProgress.value = Math.round((e.loaded * 100) / (e.total || 1))
                },
            })

            // Backend returns the new ExcuseRequest with student & session loaded
            // POST /v1/me/excuses → { data: ExcuseRequest, message: '...' }
            if (data.data) {
                excuses.value = [data.data, ...excuses.value]
            } else {
                await fetchExcuses()
            }

            successMsg.value = 'Your excuse request has been submitted and is awaiting review.'

            // Session just used is no longer eligible — refresh the dropdown
            await fetchAbsentSessions()
        } catch (err: any) {
            // Surface the exact validation message from Laravel (422 responses)
            const serverMsg =
                err?.response?.data?.message ??
                err?.response?.data?.errors?.session_id?.[0] ??
                err?.message ??
                'Failed to submit your excuse request. Please try again.'
            errorMsg.value = serverMsg
            console.error('[useExcuses] submitExcuse failed:', err)
            throw err  // re-throw so form does NOT clear on failure
        } finally {
            isSubmitting.value = false
            uploadProgress.value = 0
        }
    }

    return {
        excuses,
        absentSessions,
        isLoading,
        isSubmitting,
        uploadProgress,
        errorMsg,
        successMsg,
        fetchExcuses,
        fetchAbsentSessions,
        submitExcuse,
    }
}