import { ref } from 'vue'

export function useConfirm() {
    const isOpen = ref(false)
    const message = ref('')
    const title = ref('Confirm Action')
    let resolvePromise: ((value: boolean) => void) | null = null

    const confirm = (msg: string, titleStr = 'Confirm Action'): Promise<boolean> => {
        message.value = msg
        title.value = titleStr
        isOpen.value = true
        return new Promise((resolve) => {
            resolvePromise = resolve
        })
    }

    const accept = () => {
        isOpen.value = false
        resolvePromise?.(true)
        resolvePromise = null
    }

    const cancel = () => {
        isOpen.value = false
        resolvePromise?.(false)
        resolvePromise = null
    }

    return { isOpen, message, title, confirm, accept, cancel }
}
