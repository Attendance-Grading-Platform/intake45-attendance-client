import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { ActiveCohort, Track, TrackRef } from '@/types/cohort.types'

export const listTracks = () =>
    api.get<ApiResponse<TrackRef[]>>('/v1/tracks')

export const getTrackCohorts = (trackId: number) =>
    api.get<ApiResponse<ActiveCohort[]>>(`/v1/tracks/${trackId}/cohorts`)

export type { Track, TrackRef, ActiveCohort }
