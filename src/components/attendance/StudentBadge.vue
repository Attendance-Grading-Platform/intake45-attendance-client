<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import QrcodeVue from 'qrcode.vue'

const authStore = useAuthStore()

// We create a strictly formatted JSON string to be encoded in the QR.
// Only the student_id is required per the new enterprise pattern.
const qrPayload = computed(() => {
  const studentId = authStore.user?.id
  if (!studentId) return ''
  return JSON.stringify({ student_id: studentId })
})

const qrContainer = ref<HTMLElement | null>(null)

const downloadBadge = () => {
  if (!qrContainer.value) return
  const canvas = qrContainer.value.querySelector('canvas')
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `attendance-badge-${authStore.user?.id || 'student'}.png`
  link.href = dataUrl
  link.click()
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
    
    <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
    </div>

    <h2 class="text-xl font-bold text-slate-800 mb-1">Your Attendance Badge</h2>
    <p class="text-sm text-slate-500 mb-6 px-4">
      This is your permanent digital badge. Show this QR code to your instructor when you enter the session to record your attendance.
    </p>

    <!-- QR Code Render -->
    <div v-if="qrPayload" ref="qrContainer" class="p-4 bg-white border-2 border-dashed border-slate-200 rounded-xl">
      <QrcodeVue :value="qrPayload" :size="200" level="H" render-as="canvas" />
    </div>
    <div v-else class="h-[232px] w-[232px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
      Loading badge...
    </div>

    <button 
      v-if="qrPayload"
      @click="downloadBadge"
      class="mt-6 w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
    >
      <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Offline Badge
    </button>

    <div class="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <span>Student ID:</span>
      <span class="px-2 py-1 bg-slate-100 rounded text-slate-600">{{ authStore.user?.id || '---' }}</span>
    </div>
  </div>
</template>
