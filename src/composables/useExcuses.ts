import { ref, computed } from 'vue'
import { getExcuses, createExcuse, type ExcuseRequest } from '@/api/modules/excuse.api'
import api from '@/api/axios'

export function useExcuses() {
    const excuses = ref<ExcuseRequest[]>([])
    const absentSessions = ref<unknown[]>([])
    const isLoading = ref(false)
    const isSubmitting = ref(false)
    const errorMsg = ref<string | null>(null)
    const successMsg = ref<string | null>(null)

    const fetchExcuses = async () => {
        isLoading.value = true
        errorMsg.value = null
        try {
            const res = await getExcuses()
            excuses.value = res.data.data || []
        } catch (err) {
            errorMsg.value = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch excuses'
            console.error('Fetch excuses error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const fetchAbsentSessions = async () => {
        try {
            const res = await api.get('/v1/me/absent-sessions')
            absentSessions.value = res.data.data || []
        } catch (err) {
            console.error('Fetch absent sessions error:', err)
            // Silently fail or handle as needed
        }
    }

    const submitExcuse = async (sessionId: number, reason: string, file?: File | null) => {
        isSubmitting.value = true
        errorMsg.value = null
        successMsg.value = null
        
        try {
            const formData = new FormData()
            formData.append('session_id', sessionId.toString())
            formData.append('reason', reason)
            
            if (file) {
                // Validation
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
                if (!allowedTypes.includes(file.type)) {
                    throw new Error("Invalid file type. Only PDF, JPG, and PNG are allowed.")
                }
                const maxBytes = 1 * 1024 * 1024 // 1MB
                if (file.size > maxBytes) {
                    throw new Error("File size exceeds 1MB limit.")
                }
                
                formData.append('attachment', file)
            }

            await createExcuse(formData)
            successMsg.value = 'Excuse submitted successfully!'
            
            // Refresh the list after submission
            await fetchExcuses()
            await fetchAbsentSessions()
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } }; message?: string }
            if (e.response) {
                errorMsg.value = e.response.data?.message ?? 'Failed to submit excuse'
            } else {
                errorMsg.value = e.message ?? 'An unknown error occurred.'
            }
            throw err // Re-throw to allow component to handle it if needed
        } finally {
            isSubmitting.value = false
        }
    }

    return {
        excuses,
        absentSessions,
        isLoading,
        isSubmitting,
        errorMsg,
        successMsg,
        fetchExcuses,
        fetchAbsentSessions,
        submitExcuse
    }
}
