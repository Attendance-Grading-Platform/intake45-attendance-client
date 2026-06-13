import { ref, computed } from 'vue'
import { listTracks, getTrackCohorts } from '@/api/modules/track.api'
import type { ActiveCohort, Track, TrackRef } from '@/types/cohort.types'

function unwrapData<T>(res: { data: { data?: T } }): T {
    return (res.data.data ?? res.data) as T
}

function normalizeCohort(raw: Partial<ActiveCohort> & { id: number; name: string }): ActiveCohort {
    return {
        id: raw.id,
        name: raw.name,
        status: raw.status ?? 'closed',
        started_at: raw.started_at ?? '',
        ended_at: raw.ended_at ?? null,
        students_count: raw.students_count ?? 0,
    }
}

function isEnrichedTrack(raw: TrackRef & Partial<Track>): raw is Track {
    return 'active_cohort' in raw || 'cohorts_count' in raw
}

async function enrichTrack(raw: TrackRef): Promise<Track> {
    const cohortsRes = await getTrackCohorts(raw.id)
    const cohorts = unwrapData<ActiveCohort[]>(cohortsRes).map(normalizeCohort)
    const active = cohorts.find((c) => c.status === 'active') ?? null

    return {
        id: raw.id,
        name: raw.name,
        active_cohort: active,
        cohorts_count: cohorts.length,
    }
}

export function useTracks() {
    const tracks = ref<Track[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const totalStudents = computed(() =>
        tracks.value.reduce((sum, t) => sum + (t.active_cohort?.students_count ?? 0), 0),
    )

    const activeCohortsCount = computed(() =>
        tracks.value.filter((t) => t.active_cohort !== null).length,
    )

    const hasClosedCohorts = computed(() =>
        tracks.value.some((t) => t.cohorts_count > (t.active_cohort ? 1 : 0)),
    )

    async function fetchTracks(): Promise<void> {
        loading.value = true
        error.value = null

        try {
            const res = await listTracks()
            const raw = unwrapData<Array<TrackRef & Partial<Track>>>(res)

            if (raw.length > 0 && raw.every(isEnrichedTrack)) {
                tracks.value = raw.map((t) => ({
                    id: t.id,
                    name: t.name,
                    active_cohort: t.active_cohort ?? null,
                    cohorts_count: t.cohorts_count ?? 0,
                }))
            } else {
                tracks.value = await Promise.all(raw.map(enrichTrack))
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            error.value = message ?? 'Failed to load tracks.'
        } finally {
            loading.value = false
        }
    }

    async function fetchTrackHistory(trackId: number): Promise<ActiveCohort[]> {
        const res = await getTrackCohorts(trackId)
        return unwrapData<ActiveCohort[]>(res).map(normalizeCohort)
    }

    return {
        tracks,
        loading,
        error,
        totalStudents,
        activeCohortsCount,
        hasClosedCohorts,
        fetchTracks,
        fetchTrackHistory,
    }
}
