<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEngagementStore } from '@/stores/engagement.store'
import api from '@/api/axios'

const route = useRoute()
const router = useRouter()
const engagementStore = useEngagementStore()

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    await engagementStore.fetchById(id)
  }
})

function formatFriendlyDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

async function deleteEngagement() {
  if (!confirm('Are you sure you want to delete this engagement and all its sessions?')) return
  
  try {
    await api.delete(`/v1/engagements/${engagementStore.currentEngagement?.id}`)
    router.push({ name: 'track-admin-engagements' })
  } catch (error) {
    console.error('Failed to delete engagement', error)
    alert('Failed to delete engagement')
  }
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
    <!-- Header -->
    <div class="mb-8 flex justify-between items-start">
      <div>
        <button @click="router.push({ name: 'track-admin-engagements' })" class="text-indigo-500 hover:text-indigo-600 text-sm font-medium mb-2 flex items-center">
          &larr; Back to Calendar
        </button>
        <h1 class="text-2xl md:text-3xl text-slate-800 font-bold">Engagement Details</h1>
      </div>
      <button @click="deleteEngagement" class="btn bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
        Delete Engagement
      </button>
    </div>

    <!-- Loading -->
    <div v-if="engagementStore.isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>

    <template v-else-if="engagementStore.currentEngagement">
      <!-- Details Card -->
      <div class="bg-white shadow-lg rounded-sm border border-slate-200 mb-8 overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-slate-800">Overview</h2>
            <span class="px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wide bg-indigo-100 text-indigo-800">
              {{ engagementStore.currentEngagement.type.replace('_', ' ') }}
            </span>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div class="text-sm font-medium text-slate-500 mb-1">Instructor</div>
              <div class="text-base font-bold text-slate-800">{{ engagementStore.currentEngagement.instructor?.name }}</div>
              <div class="text-xs text-slate-500">{{ engagementStore.currentEngagement.instructor?.email }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-slate-500 mb-1">Cohort</div>
              <div class="text-base font-bold text-slate-800">{{ engagementStore.currentEngagement.cohorts?.[0]?.name || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-slate-500 mb-1">Duration</div>
              <div class="text-base font-bold text-slate-800">{{ formatFriendlyDate(engagementStore.currentEngagement.start_date) }}</div>
              <div class="text-sm text-slate-500">to {{ formatFriendlyDate(engagementStore.currentEngagement.end_date) }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-slate-500 mb-1">Scheduled Hours</div>
              <div class="text-2xl font-bold text-indigo-600">{{ engagementStore.currentEngagement.scheduled_hours }}<span class="text-sm text-slate-500 font-medium"> hrs total</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sessions List -->
      <div class="bg-white shadow-lg rounded-sm border border-slate-200">
        <div class="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-800">Generated Sessions ({{ engagementStore.currentEngagement.sessions?.length || 0 }})</h2>
        </div>
        <div class="p-0 overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th class="px-6 py-3 font-semibold">ID</th>
                <th class="px-6 py-3 font-semibold">Session Date</th>
                <th class="px-6 py-3 font-semibold">Day</th>
                <th class="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr v-for="session in engagementStore.currentEngagement.sessions" :key="session.id" class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-6 py-4 font-medium text-slate-600">#{{ session.id }}</td>
                <td class="px-6 py-4 font-medium text-slate-800">{{ formatFriendlyDate(session.session_date) }}</td>
                <td class="px-6 py-4 text-slate-500">{{ new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'long' }) }}</td>
                <td class="px-6 py-4">
                  <span v-if="session.delivered" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Delivered
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Pending
                  </span>
                </td>
              </tr>
              <tr v-if="!engagementStore.currentEngagement.sessions?.length">
                <td colspan="4" class="px-6 py-8 text-center text-slate-500">No sessions generated for this engagement.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    
    <div v-else class="text-center py-20 text-slate-500">
      Engagement not found.
    </div>
  </div>
</template>
