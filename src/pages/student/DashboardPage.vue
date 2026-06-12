<template>
  <div class="space-y-8 max-w-content mx-auto pb-10">
    <header>
      <p class="text-label text-neutral-500 mb-2">WELCOME BACK</p>
      <h1 class="font-serif text-h1 text-neutral-800">{{ authStore.user?.name || 'Student' }}</h1>
      <hr class="border-neutral-300 mt-4" />
    </header>

    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- Left: Announcements -->
      <div class="w-full lg:w-[65%] space-y-6">
        <h3 class="text-label text-brand-red font-semibold flex justify-between items-center">
          <span>MY ANNOUNCEMENTS</span>
          <router-link to="/student/announcements" class="text-brand-red hover:underline underline-offset-4 font-normal">VIEW ALL</router-link>
        </h3>
        
        <div v-if="announcementsStore.isLoading" class="text-neutral-600">
          Loading announcements...
        </div>
        
        <div v-else-if="announcementsStore.announcements.length === 0" class="bg-neutral-0 border border-neutral-300 rounded-card p-6 text-center text-neutral-600">
          <h3 class="font-serif text-[20px] text-neutral-800 mb-2">No announcements</h3>
          <p class="text-base">You're all caught up!</p>
        </div>
        
        <div v-else class="space-y-6">
          <div v-for="announcement in displayedAnnouncements" :key="announcement.id" class="bg-neutral-0 border border-neutral-300 rounded-card p-6 flex flex-col gap-4 items-start hover:shadow-drawer transition-shadow duration-slow">
             <div class="w-full flex flex-col h-full justify-between">
                 <div>
                   <p class="text-label text-neutral-500 mb-2">CAMPUS NEWS • {{ formatDate(announcement.published_at) }}</p>
                   <h2 class="font-serif text-h2 text-brand-red mb-3 leading-tight">{{ announcement.title }}</h2>
                   <p class="text-base text-neutral-600 line-clamp-3 mb-4">{{ announcement.body }}</p>
                 </div>
                 <router-link to="/student/announcements" class="text-base font-bold text-brand-red hover:underline underline-offset-4 flex items-center mt-2 group">
                   Read more <span class="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                 </router-link>
             </div>
          </div>
        </div>
      </div>

      <!-- Right: Stats -->
      <div class="w-full lg:w-[35%] space-y-6">
        <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
          <h3 class="text-label text-neutral-500 mb-6">ATTENDANCE LEDGER</h3>
          
          <div v-if="attendanceStore.isLoading" class="text-neutral-600">
            Loading ledger...
          </div>
          <div v-else-if="attendanceStore.studentAttendance">
            <div class="flex items-baseline mb-4">
              <span class="font-serif text-[48px] leading-none" :class="ledgerColorClass">{{ ledgerBalance }}</span>
              <span class="text-md text-neutral-600 ml-2">/ 250 points</span>
            </div>
            
            <p class="text-sm text-neutral-600 mb-2">{{ ledgerPercentage }}% completion rate</p>
            
            <!-- Progress Bar -->
            <div class="w-full h-[6px] bg-neutral-200 rounded-full overflow-hidden mb-8">
              <div class="h-full rounded-full transition-all duration-1000 ease-out" :class="ledgerBgClass" :style="{ width: `${ledgerPercentage}%` }"></div>
            </div>
            
            <div class="flex justify-between border-t border-neutral-300 pt-5">
              <div>
                <p class="text-label text-neutral-500 mb-2">STATUS</p>
                <p class="text-base font-medium text-neutral-800 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="attendanceStore.studentAttendance.is_at_risk ? 'bg-warning' : 'bg-success'"></span>
                  {{ attendanceStore.studentAttendance.is_at_risk ? 'At Risk' : 'Compliant' }}
                </p>
              </div>
              <div class="text-right">
                 <p class="text-label text-neutral-500 mb-2">REQUIRED</p>
                 <p class="text-base font-medium text-neutral-800">200 points (80%)</p>
              </div>
            </div>
          </div>
          <div v-else class="text-neutral-600">
            Ledger unavailable.
          </div>
        </div>
        
        <!-- Upcoming Deadlines -->
        <div class="bg-neutral-0 border border-neutral-300 rounded-card p-6">
          <div class="flex justify-between items-center mb-6 border-b border-neutral-300 pb-4">
            <h3 class="text-label text-neutral-500">UPCOMING DEADLINES</h3>
          </div>
          
          <div v-if="deliverableStore.isLoading" class="text-neutral-600">
            Loading deadlines...
          </div>
          <div v-else-if="pendingDeliverables.length === 0" class="text-neutral-600">
            No upcoming deadlines!
          </div>
          <div v-else class="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="deliv in pendingDeliverables" :key="deliv.id" class="flex justify-between items-center bg-neutral-50 p-4 rounded-btn border border-neutral-200">
              <div>
                <p class="font-bold text-sm text-neutral-800">{{ deliv.title }}</p>
                <p class="text-xs text-neutral-500">{{ deliv.course_name }} • Due: {{ formatDate(deliv.due_date) }}</p>
              </div>
              <button 
                @click="openSubmissionModal(deliv)" 
                class="px-4 py-2 bg-brand-red text-white text-sm font-medium rounded-btn hover:bg-brand-red/90 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submission Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-[10px] shadow-lg w-full max-w-md overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <div>
            <h3 class="font-serif text-xl text-neutral-900">Submit Assignment</h3>
            <p class="text-sm text-neutral-500">{{ selectedDeliverable?.title }}</p>
          </div>
          <button @click="closeSubmissionModal" class="text-neutral-400 hover:text-neutral-600">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <AssignmentSubmission 
            :isSubmitting="isSubmitting"
            @submit-payload="handleComponentSubmit"
          />
          <p v-if="formError" class="mt-4 text-sm text-danger text-center">{{ formError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCohortStore } from '@/stores/cohort.store'
import { useAnnouncementsStore } from '@/stores/announcements.store'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useDeliverableStore } from '@/stores/deliverable.store'
import AssignmentSubmission from '@/components/student/AssignmentSubmission.vue'
import type { Deliverable } from '@/api/modules/deliverable.api'

const authStore = useAuthStore()
const cohortStore = useCohortStore()
const announcementsStore = useAnnouncementsStore()
const attendanceStore = useAttendanceStore()
const deliverableStore = useDeliverableStore()

const ledgerBalance = computed(() => {
    return attendanceStore.studentAttendance?.ledger_balance || 0
})

const ledgerPercentage = computed(() => {
    return Math.max(0, Math.min(100, Math.round((ledgerBalance.value / 250) * 100)))
})

const ledgerColorClass = computed(() => {
    if (ledgerBalance.value >= 200) return 'text-brand-red'
    if (ledgerBalance.value >= 150) return 'text-warning'
    return 'text-danger'
})

const ledgerBgClass = computed(() => {
    if (ledgerBalance.value >= 200) return 'bg-brand-red'
    if (ledgerBalance.value >= 150) return 'bg-warning'
    return 'bg-danger'
})

const displayedAnnouncements = computed(() => {
    return announcementsStore.announcements.slice(0, 2)
})

const pendingDeliverables = computed(() => {
    return deliverableStore.deliverables
        .filter(d => d.status === 'pending')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
})

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'OCT 12'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

// Modal and Submission State
const showModal = ref(false)
const selectedDeliverable = ref<Deliverable | null>(null)
const isSubmitting = ref(false)
const formError = ref('')

const openSubmissionModal = (deliverable: Deliverable) => {
    selectedDeliverable.value = deliverable
    formError.value = ''
    showModal.value = true
}

const closeSubmissionModal = () => {
    showModal.value = false
    selectedDeliverable.value = null
}

const handleComponentSubmit = async (emittedFormData: FormData) => {
    if (!selectedDeliverable.value) return

    isSubmitting.value = true
    formError.value = ''

    try {
        const formData = new FormData()
        formData.append('course_component_id', selectedDeliverable.value.id.toString())
        
        // Map the payload keys from the teammate's component to the backend's expected keys
        const url = emittedFormData.get('url')
        const file = emittedFormData.get('file')
        
        if (url) formData.append('submission_url', url as string)
        if (file) formData.append('submission_file', file as Blob)

        await deliverableStore.submitDeliverable(formData)
        closeSubmissionModal()
    } catch (err: any) {
        formError.value = err.response?.data?.message || 'Failed to submit assignment. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
onMounted(async () => {
    if (authStore.user?.id) {
        attendanceStore.fetchStudentAttendance()
    }
    
    // Fetch deliverables for the Upcoming Deadlines card
    await deliverableStore.fetchMyDeliverables()
    
    await cohortStore.fetchCohorts()
    // Find active cohort to fetch announcements
    if (cohortStore.cohorts.length > 0) {
        const activeCohort = cohortStore.cohorts.find(c => c.status === 'active') || cohortStore.cohorts[0]
        if (activeCohort) {
            announcementsStore.fetchCohortAnnouncements(activeCohort.id)
        }
    }
})
</script>
