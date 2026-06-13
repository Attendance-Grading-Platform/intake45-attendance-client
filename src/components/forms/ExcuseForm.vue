<script setup lang="ts">
import { ref } from 'vue'

interface AbsentSession {
  id: number
  session_date: string
  engagement?: { type?: string }
}

defineProps<{
  isSubmitting: boolean
  absentSessions: AbsentSession[]
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { sessionId: number; reason: string; file: File | null }): void
}>()

const sessionId = ref<number | ''>('')
const reason = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)

const handleFileChange = (e: Event) => {
  fileError.value = null
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    
    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!validTypes.includes(file.type)) {
      fileError.value = 'Only PDF, JPG, and PNG are allowed.'
      target.value = ''
      selectedFile.value = null
      return
    }

    // Validate size (max 1MB)
    if (file.size > 1048576) {
      fileError.value = 'File must be less than 1MB.'
      target.value = ''
      selectedFile.value = null
      return
    }

    selectedFile.value = file
  } else {
    selectedFile.value = null
  }
}

const handleSubmit = () => {
  if (!sessionId.value || !reason.value) return
  if (fileError.value) return

  emit('submit', {
    sessionId: Number(sessionId.value),
    reason: reason.value,
    file: selectedFile.value
  })

  // Optional: Reset form could be called from parent via ref, but let's clear here mostly
  // If parent decides to clear, they can.
}

// Simple expose to clear form if needed
defineExpose({
    clearForm: () => {
        sessionId.value = ''
        reason.value = ''
        selectedFile.value = null
        if (fileInput.value) fileInput.value.value = ''
    }
})
</script>

<template>
  <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <h2 class="text-xl font-bold text-slate-800 mb-4">Submit an Excuse</h2>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      
      <!-- Session ID -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Session Date <span class="text-rose-500">*</span></label>
        <select 
          v-model="sessionId"
          required
          :disabled="absentSessions.length === 0"
          class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
        >
          <option value="" disabled>
            {{ absentSessions.length === 0 ? 'No eligible absent sessions found.' : 'Select a session' }}
          </option>
          <option v-for="session in absentSessions" :key="session.id" :value="session.id">
            {{ session.session_date }} ({{ session.engagement?.type || 'Session' }})
          </option>
        </select>
        <p class="text-[11px] text-slate-400 mt-1">Select the session you missed.</p>
      </div>

      <!-- Reason -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Reason <span class="text-rose-500">*</span></label>
        <textarea 
          v-model="reason"
          required
          rows="3"
          placeholder="Please explain the reason for your absence..."
          class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-none"
        ></textarea>
      </div>

      <!-- File Upload -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Proof Document <span class="text-slate-400 font-normal">(Optional)</span></label>
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
          <div class="space-y-1 text-center">
            <svg class="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="flex text-sm text-slate-600 justify-center">
              <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" class="sr-only" ref="fileInput" @change="handleFileChange" accept=".pdf,image/jpeg,image/png">
              </label>
            </div>
            <p class="text-xs text-slate-500">PDF, PNG, JPG up to 1MB</p>
          </div>
        </div>
        <p v-if="selectedFile && !fileError" class="mt-2 text-sm text-emerald-600 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
        </p>
        <p v-if="fileError" class="mt-2 text-sm text-rose-500 flex items-center gap-1">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
           {{ fileError }}
        </p>
      </div>

      <!-- Submit -->
      <div class="pt-2">
        <button 
          type="submit" 
          :disabled="isSubmitting || !!fileError"
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
          </span>
          <span v-else>Submit Request</span>
        </button>
      </div>
    </form>
  </div>
</template>
