import { ref, computed } from 'vue'
import { listCohorts, createCohort as apiCreateCohort, closeCohort as apiCloseCohort } from '@/api/modules/cohort.api'
import { listTracks } from '@/api/modules/track.api'
import { listUsers } from '@/api/modules/user.api'
import type { CohortRow, TrackRef, CreateCohortPayload } from '@/types/cohort.types'
import type { UserSummary } from '@/api/modules/user.api'

export function useCohorts() {
    // Data
    const cohorts = ref<CohortRow[]>([])
    const tracks = ref<TrackRef[]>([])
    const trackAdmins = ref<UserSummary[]>([])

    // Loading states
    const loadingCohorts = ref(false)
    const loadingTracks = ref(false)
    const loadingAdmins = ref(false)
    const creating = ref(false)
    const closing = ref(false)

    // Errors
    const cohortsError = ref<string | null>(null)
    const formError = ref<string | null>(null)
    const fieldErrors = ref<Record<string, string>>({})

    async function fetchAll() {
        loadingCohorts.value = true
        loadingTracks.value = true
        loadingAdmins.value = true
        cohortsError.value = null

        // Load each independently so one failure doesn't block others
        try {
            const res = await listCohorts()
            cohorts.value = res.data.data
        } catch (err) {
            const e = err as { response?: { status?: number }; message?: string }
            console.error('[useCohorts] listCohorts failed:', e.response?.status, e.message)
            cohortsError.value = 'Could not load cohorts.'
        } finally {
            loadingCohorts.value = false
        }

        try {
            const res = await listTracks()
            tracks.value = res.data.data
            console.log('[useCohorts] tracks loaded:', tracks.value.length)
        } catch (err) {
            const _e = err as { response?: { status?: number }; message?: string }
            console.error('[useCohorts] listTracks failed:', _e.response?.status, _e.message)
        } finally {
            loadingTracks.value = false
        }

        try {
            const res = await listUsers('track_admin')
            trackAdmins.value = res.data.data
            console.log('[useCohorts] admins loaded:', trackAdmins.value.length)
        } catch (err) {
            const _e2 = err as { response?: { status?: number }; message?: string }
            console.error('[useCohorts] listUsers failed:', _e2.response?.status, _e2.message)
        } finally {
            loadingAdmins.value = false
        }
    }

    async function createCohort(data: CreateCohortPayload) {
        creating.value = true
        formError.value = null
        fieldErrors.value = {}

        try {
            await apiCreateCohort(data)
            await fetchAll() // Refresh table
        } catch (err) {
            const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }
            if (e.response?.status === 422) {
                const message = e.response.data?.message ?? ''
                if (message.toLowerCase().includes('active cohort')) {
                    formError.value = 'This track already has an active cohort. You must close the existing cohort before creating a new one.'
                } else {
                    const errs = e.response.data?.errors ?? {}
                    const mapped: Record<string, string> = {}
                    for (const k in errs) {
                        const messages = errs[k]
                        if (Array.isArray(messages) && messages.length > 0) {
                            mapped[k] = messages[0] || ''
                        }
                    }
                    fieldErrors.value = mapped
                }
            } else if (e.response?.status === 403) {
                formError.value = 'Only Branch Managers can create cohorts.'
            } else {
                formError.value = 'Something went wrong. Please try again.'
            }
            throw err
        } finally {
            creating.value = false
        }
    }

    async function closeCohort(id: number) {
        closing.value = true
        try {
            await apiCloseCohort(id)
            await fetchAll()
        } catch (err) {
            console.error('Close cohort failed:', err)
            throw err
        } finally {
            closing.value = false
        }
    }

    function trackHasActiveCohort(trackId: number): boolean {
        return cohorts.value.some(c => c.track.id === trackId && c.status === 'active')
    }

    function getFilteredCohorts(search: string, trackId: number | 'all', status: 'all' | 'active' | 'closed') {
        return cohorts.value.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
            const matchesTrack = trackId === 'all' || c.track.id === trackId
            const matchesStatus = status === 'all' || c.status === status
            return matchesSearch && matchesTrack && matchesStatus
        })
    }

    return {
        cohorts,
        tracks,
        trackAdmins,
        loadingCohorts,
        loadingTracks,
        loadingAdmins,
        creating,
        closing,
        cohortsError,
        formError,
        fieldErrors,
        fetchAll,
        createCohort,
        closeCohort,
        trackHasActiveCohort,
        getFilteredCohorts
    }
}
