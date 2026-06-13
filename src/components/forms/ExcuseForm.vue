<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUpload from '@/components/forms/FileUpload.vue'

/** Formats a raw date string (e.g. "2026-06-01" or ISO datetime) into a human-readable label. */
const formatSessionDate = (raw: string): string => {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw // fallback: show as-is if unparseable
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

interface AbsentSession {
    id: number
    session_date: string
    engagement?: { type?: string }
}

const props = withDefaults(defineProps<{
    isSubmitting: boolean
    uploadProgress?: number
    absentSessions: AbsentSession[]
}>(), {
    uploadProgress: 0,
})

const emit = defineEmits<{
    (e: 'submit', payload: { sessionId: number; reason: string; file: File | null }): void
}>()

const sessionId = ref<number | ''>('')
const reason = ref('')
const selectedFile = ref<File | null>(null)

// Button is enabled only when a session AND a non-empty reason are both present
const canSubmit = computed(() =>
    !props.isSubmitting && !!sessionId.value && reason.value.trim().length > 0
)

const handleSubmit = () => {
    if (!canSubmit.value) return
    emit('submit', {
        sessionId: Number(sessionId.value),
        reason: reason.value.trim(),
        file: selectedFile.value,
    })
}

defineExpose({
    clearForm: () => {
        sessionId.value = ''
        reason.value = ''
        selectedFile.value = null
    },
})
</script>

<template>
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Submit an Excuse</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">

            <!-- Session Date -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                    Session Date <span class="text-rose-500">*</span>
                </label>
                <select
                    v-model="sessionId"
                    required
                    :disabled="absentSessions.length === 0 || isSubmitting"
                    class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>
                        {{ absentSessions.length === 0 ? 'No eligible absent sessions found.' : 'Select a session' }}
                    </option>
                    <option v-for="session in absentSessions" :key="session.id" :value="session.id">
                        {{ formatSessionDate(session.session_date) }}
                        <template v-if="session.engagement?.type"> ({{ session.engagement.type.replace('_', ' ') }})</template>
                    </option>
                </select>
                <p class="text-[11px] text-slate-400 mt-1">Select the session you missed.</p>
            </div>

            <!-- Reason -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                    Reason <span class="text-rose-500">*</span>
                </label>
                <textarea
                    v-model="reason"
                    required
                    rows="3"
                    maxlength="2000"
                    placeholder="Please explain the reason for your absence..."
                    :disabled="isSubmitting"
                    class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-none disabled:opacity-60"
                ></textarea>
            </div>

            <!-- File Upload -->
            <div>
                <FileUpload
                    @update:file="selectedFile = $event"
                    label="Proof Document"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    :maxSizeMb="1"
                />
            </div>

            <!-- Submit + Progress -->
            <div class="pt-2 space-y-2">
                <button
                    type="submit"
                    :disabled="!canSubmit"
                    class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <span v-if="isSubmitting" class="flex items-center gap-2">
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {{ selectedFile ? 'Uploading...' : 'Submitting...' }}
                    </span>
                    <span v-else>Submit Request</span>
                </button>

                <!-- Upload progress bar — only visible during a file upload -->
                <Transition name="fade">
                    <div v-if="isSubmitting && selectedFile" class="w-full">
                        <div class="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Uploading attachment…</span>
                            <span class="font-medium tabular-nums">{{ props.uploadProgress }}%</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                class="h-full bg-indigo-600 rounded-full transition-[width] duration-300 ease-out"
                                :style="{ width: `${props.uploadProgress}%` }"
                            ></div>
                        </div>
                    </div>
                </Transition>
            </div>

        </form>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>