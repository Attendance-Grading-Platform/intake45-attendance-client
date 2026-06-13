import { ref } from 'vue'

export interface Toast {
    id: number
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
    const addToast = (message: string, type: Toast['type'] = 'info', duration = 3500) => {
        const id = ++nextId
        toasts.value.push({ id, type, message })
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id)
        }, duration)
    }

    const success = (message: string) => addToast(message, 'success')
    const error = (message: string) => addToast(message, 'error')
    const info = (message: string) => addToast(message, 'info')
    const warning = (message: string) => addToast(message, 'warning')
    const dismiss = (id: number) => { toasts.value = toasts.value.filter(t => t.id !== id) }

    return { toasts, success, error, info, warning, dismiss }
}
