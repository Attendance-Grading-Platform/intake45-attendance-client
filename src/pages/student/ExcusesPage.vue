<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useExcuses } from '@/composables/useExcuses'
import ExcuseForm from '@/components/forms/ExcuseForm.vue'

const {
  excuses,
  isLoading,
  isSubmitting,
  uploadProgress,
  errorMsg,
  successMsg,
  absentSessions,
  fetchExcuses,
  fetchAbsentSessions,
  submitExcuse,
} = useExcuses()

const formRef = ref<InstanceType<typeof ExcuseForm> | null>(null)

onMounted(() => {
  fetchExcuses()
  fetchAbsentSessions()
})

const handleExcuseSubmit = async (payload: { sessionId: number; reason: string; file: File | null }) => {
  try {
    await submitExcuse(payload.sessionId, payload.reason, payload.file)
    // On success, clear form
    if (formRef.value) {
      formRef.value.clearForm()
    }
  } catch {
    // Error is handled by the composable and shown in errorMsg
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-amber-100 text-amber-800 border-amber-200'
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/** Formats a raw session_date value (e.g. "2026-06-01") into a readable string like "Saturday, June 14, 2026" */
const formatSessionDate = (raw?: string) => {
  if (!raw) return 'Unknown Date'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

/**
 * Returns a URL that streams the attachment through the authenticated
 * backend endpoint GET /v1/me/excuses/{id}/attachment.
 * This works because the file is on the `local` disk (not publicly served)
 * and must go through Laravel's auth middleware to be accessible.
 */
const getAttachmentUrl = (excuseId: number) => {
  const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  // Strip any trailing /api/v1 suffix — we need just the origin + /api/v1
  let base = rawBase
  try {
    const u = new URL(rawBase)
    // Keep full path but ensure no double slashes
    base = `${u.origin}${u.pathname.replace(/\/$/, '')}`
  } catch { /* keep rawBase */ }
  // Ensure it ends exactly at /api/v1
  if (!base.includes('/api')) base = base.replace(/\/$/, '') + '/api/v1'
  return `${base}/me/excuses/${excuseId}/attachment`
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-8">

    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">My Excuses</h1>
      <p class="text-slate-500 mt-1">Submit excuses for missed sessions and track their status.</p>
    </div>

    <!-- Global Feedback -->
    <div v-if="successMsg" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
      <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {{ successMsg }}
    </div>

    <div v-if="errorMsg" class="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
      <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {{ errorMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Left Column: Form -->
      <div class="lg:col-span-1">
        <ExcuseForm
          ref="formRef"
          :is-submitting="isSubmitting"
          :upload-progress="uploadProgress"
          :absent-sessions="(absentSessions as any[])"
          @submit="handleExcuseSubmit"
        />
      </div>

      <!-- Right Column: History -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 class="text-lg font-bold text-slate-800">Request History</h2>
          </div>

          <div v-if="isLoading" class="p-8 flex justify-center">
             <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>

          <div v-else-if="excuses.length === 0" class="p-8 text-center text-slate-500">
            You haven't submitted any excuse requests yet.
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div v-for="excuse in excuses" :key="excuse.id" class="p-6 hover:bg-slate-50 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <!-- Show real session date if loaded, fall back to "Session #ID" -->
                    <span class="font-bold text-slate-800">
                      {{ excuse.session?.session_date ? formatSessionDate(excuse.session.session_date) : `Session #${excuse.session_id}` }}
                    </span>
                    <span v-if="excuse.session?.engagement" class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase tracking-wide">
                      {{ excuse.session.engagement.type.replace('_', ' ') }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500">
                    Requested on {{ formatDate(excuse.created_at) }}
                  </div>
                </div>
                <div>
                  <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border" :class="getStatusColor(excuse.status)">
                    {{ excuse.status }}
                  </span>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700">
                <p class="font-medium mb-1">Reason:</p>
                <p class="text-slate-600 whitespace-pre-wrap">{{ excuse.reason }}</p>
              </div>

              <!-- Attachment link — served via authenticated API endpoint -->
              <div v-if="excuse.attachment_path" class="mt-4">
                <a
                  :href="getAttachmentUrl(excuse.id)"
                  target="_blank"
                  class="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  View Attachment
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>