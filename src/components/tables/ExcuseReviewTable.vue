<template>
  <div class="space-y-6">
    <!-- Header -->
    <header>
      <p class="text-label text-neutral-500 mb-1">ATTENDANCE</p>
      <h1 class="font-serif text-h1 text-neutral-800">Excuse requests</h1>
    </header>

    <!-- Tabs -->
    <div class="flex gap-6 border-b border-neutral-300">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        @click="activeTab = tab.value"
        class="pb-3 text-base font-bold transition-colors relative"
        :class="activeTab === tab.value ? 'text-brand-red' : 'text-neutral-500 hover:text-neutral-800'"
      >
        {{ tab.label }}
        <div v-if="activeTab === tab.value" class="absolute bottom-0 left-0 w-full h-0.5 bg-brand-red"></div>
      </button>
    </div>

    <!-- Table -->
    <div class="bg-neutral-0 border border-neutral-300 rounded-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-neutral-300 bg-neutral-50">
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[150px]">STUDENT NAME</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[100px]">LAB GROUP</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[130px]">SESSION DATE</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[120px]">TYPE</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[150px]">REASON</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[130px]">ATTACHMENT</th>
              <th class="p-4 text-label text-neutral-500 font-semibold min-w-[120px]">STATUS</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-for="req in paginatedRequests" :key="req.id" class="hover:bg-neutral-50 transition-colors">
              <td class="p-4">
                <p class="text-base font-bold text-neutral-800">{{ req.student?.name }}</p>
              </td>
              <td class="p-4">
                <span class="whitespace-nowrap px-2 py-1 rounded bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600 border border-neutral-200">
                  {{ req.student?.enrolled_lab_groups?.[0]?.name || 'UNASSIGNED' }}
                </span>
              </td>
              <td class="p-4 text-sm text-neutral-600">
                {{ formatDate(req.session?.session_date) }}
              </td>
              <td class="p-4">
                <span class="px-2 py-1 rounded bg-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-600 border border-neutral-200">
                  {{ req.session?.engagement?.type || 'UNKNOWN' }}
                </span>
              </td>
              <td class="p-4 text-sm text-neutral-600">
                <span class="truncate max-w-[150px] inline-block" :title="req.reason">{{ req.reason }}</span>
              </td>
              <td class="p-4">
                <button 
                  v-if="req.attachment_path"
                  @click="openAttachment(req)"
                  class="flex items-center gap-1.5 text-sm font-bold text-brand-red hover:underline focus:outline-none"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  View file
                </button>
                <span v-else class="text-neutral-400">—</span>
              </td>
              <td class="p-4">
                <span class="text-sm font-medium flex items-center gap-2" :class="getStatusTextColor(req.status)">
                  <span class="w-2 h-2 rounded-full" :class="getStatusDotClass(req.status)"></span>
                  {{ formatStatus(req.status) }}
                </span>
              </td>
              <td class="p-4 text-right">
                <button 
                  v-if="req.status === 'requested'"
                  @click="openReviewModal(req)"
                  class="px-3 py-1 rounded border border-success text-success text-xs font-bold uppercase tracking-wider hover:bg-success hover:text-white transition-colors"
                >
                  APPROVE
                </button>
                <span v-else class="text-sm text-neutral-400 italic">Resolved</span>
              </td>
            </tr>
            <tr v-if="filteredRequests.length === 0">
              <td colspan="8" class="p-8 text-center text-neutral-500">
                No requests found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-neutral-300 p-4 bg-neutral-50">
        <span class="text-sm text-neutral-600">
          Showing {{ paginatedRequests.length }} {{ activeTabLabel }} of {{ filteredRequests.length }} total requests
        </span>
        <div class="flex items-center gap-2">
          <button @click="prevPage" :disabled="currentPage === 1" class="text-neutral-500 hover:text-neutral-800 disabled:opacity-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button @click="nextPage" :disabled="currentPage >= totalPages || totalPages === 0" class="text-neutral-500 hover:text-neutral-800 disabled:opacity-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Review/Attachment Modal -->
    <div v-if="selectedRequest" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closeModal">
      <div class="bg-neutral-0 rounded-card shadow-drawer w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-neutral-300 flex justify-between items-start">
          <div>
            <h2 class="font-serif text-[24px] text-neutral-800">Review Excuse</h2>
            <p class="text-sm text-neutral-500 mt-1">{{ selectedRequest.student?.name }} • {{ formatDate(selectedRequest.session?.session_date) }}</p>
          </div>
          <button @click="closeModal" class="text-neutral-400 hover:text-neutral-800">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 class="text-label text-neutral-500 mb-2">REASON PROVIDED</h3>
            <p class="text-base text-neutral-800 bg-neutral-50 p-4 rounded border border-neutral-200">
              {{ selectedRequest.reason }}
            </p>
          </div>
          
          <div v-if="selectedRequest.attachment_path">
            <h3 class="text-label text-neutral-500 mb-2">ATTACHMENT</h3>
            <a :href="getAttachmentUrl(selectedRequest.id)" target="_blank" class="inline-flex items-center gap-2 text-brand-red hover:underline border border-brand-red px-4 py-2 rounded">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download / View File
            </a>
          </div>
        </div>

        <div class="p-6 border-t border-neutral-300 bg-neutral-50 flex justify-end gap-3" v-if="selectedRequest.status === 'requested'">
          <button @click="handleReject" class="px-6 py-2 rounded border border-danger text-danger font-bold hover:bg-danger hover:text-white transition-colors">
            REJECT
          </button>
          <button @click="handleApprove" class="px-6 py-2 rounded bg-success text-white font-bold hover:bg-green-600 transition-colors shadow-button">
            APPROVE
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { approveExcuse, rejectExcuse, type ExcuseRequest } from '@/api/modules/excuse.api'
import api from '@/api/axios'

/** Fetch all excuses via the admin-scoped GET /v1/excuses endpoint (not /me/excuses) */
const fetchAllExcuses = () => api.get('/v1/excuses')

const requests = ref<ExcuseRequest[]>([])
const isLoading = ref(false)

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const activeTab = ref('requested')
const activeTabLabel = computed(() => {
  if (activeTab.value === 'all') return ''
  return activeTab.value === 'requested' ? 'pending' : activeTab.value
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return requests.value
  return requests.value.filter(r => r.status === activeTab.value)
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10
const totalPages = computed(() => Math.ceil(filteredRequests.value.length / itemsPerPage))

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredRequests.value.slice(start, start + itemsPerPage)
})

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// Modal state
const selectedRequest = ref<ExcuseRequest | null>(null)

const loadExcuses = async () => {
  isLoading.value = true
  try {
    const res = await fetchAllExcuses()
    // Sort so requested are at top
    requests.value = (res.data.data ?? []).sort((a: ExcuseRequest, b: ExcuseRequest) => {
        if (a.status === 'requested' && b.status !== 'requested') return -1
        if (b.status === 'requested' && a.status !== 'requested') return 1
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadExcuses()
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatStatus = (status: string) => {
  if (status === 'requested') return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusTextColor = (status: string) => {
  if (status === 'requested') return 'text-brand-red'
  if (status === 'approved') return 'text-success'
  return 'text-danger'
}

const getStatusDotClass = (status: string) => {
  if (status === 'requested') return 'bg-brand-red'
  if (status === 'approved') return 'bg-success'
  return 'bg-danger'
}

const openAttachment = (req: ExcuseRequest) => {
  selectedRequest.value = req
}

const openReviewModal = (req: ExcuseRequest) => {
  selectedRequest.value = req
}

const closeModal = () => {
  selectedRequest.value = null
}

/**
 * Builds a URL that streams the file via GET /v1/excuses/{id}/attachment
 * (admin-side route — auth-protected, works for track_admin & branch_manager).
 */
const getAttachmentUrl = (excuseId: number) => {
  const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  let base = rawBase
  try {
    const u = new URL(rawBase)
    base = `${u.origin}${u.pathname.replace(/\/$/, '')}`
  } catch { /* keep rawBase */ }
  if (!base.includes('/api')) base = base.replace(/\/$/, '') + '/api/v1'
  return `${base}/excuses/${excuseId}/attachment`
}

const handleApprove = async () => {
  if (!selectedRequest.value) return
  try {
    await approveExcuse(selectedRequest.value.id)
    await loadExcuses()
    closeModal()
  } catch (err) {
    console.error(err)
    alert("Error approving excuse")
  }
}

const handleReject = async () => {
  if (!selectedRequest.value) return
  try {
    await rejectExcuse(selectedRequest.value.id)
    await loadExcuses()
    closeModal()
  } catch (err) {
    console.error(err)
    alert("Error rejecting excuse")
  }
}
</script>
