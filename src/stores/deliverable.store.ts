import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Deliverable } from '@/api/modules/deliverable.api'
import * as deliverableApi from '@/api/modules/deliverable.api'

export const useDeliverableStore = defineStore('deliverable', () => {
    const deliverables = ref<Deliverable[]>([])
    const isLoading = ref(false)

    async function fetchMyDeliverables() {
        isLoading.value = true
        try {
            const res = await deliverableApi.getMyDeliverables()
            deliverables.value = res.data.data
        } finally {
            isLoading.value = false
        }
    }

    async function submitDeliverable(data: FormData) {
        isLoading.value = true
        try {
            await deliverableApi.submitDeliverable(data)
            await fetchMyDeliverables() // Refresh list after successful submission
        } finally {
            isLoading.value = false
        }
    }

    return { deliverables, isLoading, fetchMyDeliverables, submitDeliverable }
})
