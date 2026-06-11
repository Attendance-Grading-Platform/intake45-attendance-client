import api from '@/api/axios'
import type { ApiResponse } from '@/types/api.types'
import type { Track } from '@/types/cohort.types'

export const listTracks = () =>
    api.get<ApiResponse<Track[]>>('/v1/tracks')
