import { ref, onBeforeUnmount } from 'vue'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { scanSessionQR } from '@/api/modules/attendance.api'

export function useScanner(containerId: string) {
    const scanner = ref<Html5QrcodeScanner | null>(null)
    const currentSessionId = ref<number | null>(null)
    const isScanning = ref(false)
    const errorMsg = ref<string | null>(null)
    const successMsg = ref<string | null>(null)

    const initScanner = (activeSessionId: number) => {
        currentSessionId.value = activeSessionId
        scanner.value = new Html5QrcodeScanner(
            containerId,
            { fps: 10, aspectRatio: 1.0 },
            false
        )

        scanner.value.render(onScanSuccess, onScanFailure)
        isScanning.value = true
    }

    const onScanSuccess = async (decodedText: string) => {
        if (!isScanning.value) return
        
        // Pause scanning while processing
        isScanning.value = false
        if (scanner.value) {
            scanner.value.pause(true)
        }
        
        errorMsg.value = null
        successMsg.value = null

        try {
            // Attempt to parse the JSON from QR
            const payload = JSON.parse(decodedText)
            
            if (!payload.student_id) {
                throw new Error("Invalid QR Code payload. Student ID missing.")
            }
            if (!currentSessionId.value) {
                throw new Error("No active session injected into scanner.")
            }

            // Hit the API (backend deduces track/cohort from the session & student)
            await scanSessionQR({
                session_id: currentSessionId.value,
                student_id: payload.student_id
            })

            successMsg.value = "Attendance recorded successfully!"
            
        } catch (err) {
            console.error("Scan error:", err)
            if (err instanceof SyntaxError) {
                errorMsg.value = "Invalid QR Code format. Expected JSON."
            } else {
                const e = err as { response?: { data?: { message?: string } }; message?: string }
                if (e.response) {
                    errorMsg.value = e.response.data?.message ?? "Server rejected the scan."
                } else {
                    errorMsg.value = e.message ?? "An unknown error occurred."
                }
            }
        } finally {
            // Resume scanning after 2 seconds
            setTimeout(() => {
                successMsg.value = null
                errorMsg.value = null
                isScanning.value = true
                if (scanner.value) {
                    scanner.value.resume()
                }
            }, 2000)
        }
    }

    const onScanFailure = (_error: unknown) => {
        // We ignore frequent failure errors (like when no QR is in frame)
        // console.warn(`Code scan error = ${_error}`)
    }

    const destroyScanner = () => {
        if (scanner.value) {
            scanner.value.clear().catch(e => console.error("Failed to clear scanner", e))
            scanner.value = null
        }
    }

    onBeforeUnmount(() => {
        destroyScanner()
    })

    return {
        initScanner,
        destroyScanner,
        isScanning,
        errorMsg,
        successMsg
    }
}
