import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Announcement } from '@/types/announcement.types'
import * as announcementApi from '@/api/modules/announcement.api'

export const useAnnouncementsStore = defineStore('announcements', () => {
    const announcements = ref<Announcement[]>([])
    const isLoading = ref(false)

    async function fetchCohortAnnouncements(cohortId: number) {
        isLoading.value = true
        try {
            const res = await announcementApi.getCohortAnnouncements(cohortId)
            announcements.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    return { announcements, isLoading, fetchCohortAnnouncements }
})
