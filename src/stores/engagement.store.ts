// src/stores/engagement.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Engagement, EngagementSession, StoreEngagementPayload } from '@/types/engagement.types'
import * as engagementApi from '@/api/modules/engagement.api'

export const useEngagementStore = defineStore('engagement', () => {
    const engagements = ref<Engagement[]>([])
    const currentEngagement = ref<Engagement | null>(null)
    const isLoading = ref<boolean>(false)
    const error = ref<string | null>(null)

    // A flattened array of all sessions from all engagements, with parent metadata attached
    const allSessions = computed(() => {
        const sessionsList: (EngagementSession & { parentEngagement: Engagement })[] = []
        engagements.value.forEach(eng => {
            if (eng.sessions && eng.sessions.length > 0) {
                eng.sessions.forEach((session: EngagementSession) => {
                    sessionsList.push({
                        ...session,
                        parentEngagement: eng
                    })
                })
            }
        })
        return sessionsList
    })

    async function fetchAll(params?: Record<string, unknown>): Promise<void> {
        isLoading.value = true
        error.value = null
        try {
            const res = await engagementApi.getEngagements(params)
            engagements.value = res.data.data
        } catch (err) {
            error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch engagements'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function fetchById(id: number): Promise<void> {
        isLoading.value = true
        error.value = null
        try {
            const res = await engagementApi.getEngagementById(id)
            currentEngagement.value = res.data.data
        } catch (err) {
            error.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch engagement'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function create(payload: StoreEngagementPayload): Promise<void> {
        isLoading.value = true
        error.value = null
        try {
            await engagementApi.createAdminEngagement(payload)
            // Refresh list after creation
            await fetchAll()
        } catch (err) {
            const e = err as { response?: { status?: number; data?: { message?: string } } }
            if ((e.response?.status ?? 0) >= 500) {
                error.value = 'An unexpected server error occurred. Please contact the administrator.'
            } else {
                error.value = e.response?.data?.message ?? 'Failed to create engagement'
            }
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        engagements,
        currentEngagement,
        isLoading,
        error,
        allSessions,
        fetchAll,
        fetchById,
        create
    }
})
