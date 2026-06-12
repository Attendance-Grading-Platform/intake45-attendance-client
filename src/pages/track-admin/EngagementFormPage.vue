<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEngagementStore } from '@/stores/engagement.store'
import { useCohortStore } from '@/stores/cohort.store'
import api from '@/api/axios'
import type { StoreEngagementPayload, EngagementType } from '@/types/engagement.types'

const router = useRouter()
const engagementStore = useEngagementStore()
const cohortStore = useCohortStore()

// Form state
const payload = ref<StoreEngagementPayload>({
  cohort_id: 0,
  instructor_id: 0,
  type: 'lecture',
  start_date: '',
  end_date: '',
  scheduled_hours: 0,
  days_of_week: [],
  daily_start_time: '09:00:00',
  daily_end_time: '12:00:00'
})

// Data options
const instructors = ref<any[]>([])
const daysOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

// Validation errors
const errors = ref<{ [key: string]: string }>({})

// Fetch dependencies
onMounted(async () => {
  await cohortStore.fetchCohorts()
  try {
    const res = await api.get('/v1/auth/users?role=instructor')
    instructors.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch instructors', error)
  }
})

function validateForm(): boolean {
  errors.value = {}
  let isValid = true

  if (!payload.value.cohort_id) {
    errors.value.cohort_id = 'Please select a cohort.'
    isValid = false
  }
  if (!payload.value.instructor_id) {
    errors.value.instructor_id = 'Please select an instructor.'
    isValid = false
  }
  if (!payload.value.start_date) {
    errors.value.start_date = 'Start date is required.'
    isValid = false
  } else {
    const today = new Date().toISOString().split('T')[0] || ''
    if (payload.value.start_date < today) {
      errors.value.start_date = 'Start date cannot be in the past.'
      isValid = false
    }
  }

  if (!payload.value.end_date) {
    errors.value.end_date = 'End date is required.'
    isValid = false
  } else if (payload.value.start_date && payload.value.end_date < payload.value.start_date) {
    errors.value.end_date = 'End date must be after or equal to the start date.'
    isValid = false
  }

  if (payload.value.scheduled_hours <= 0) {
    errors.value.scheduled_hours = 'Scheduled hours must be greater than 0.'
    isValid = false
  }

  if (payload.value.days_of_week.length === 0) {
    errors.value.days_of_week = 'Please select at least one day of the week.'
    isValid = false
  }

  if (!payload.value.daily_start_time) {
    errors.value.daily_start_time = 'Start time is required.'
    isValid = false
  }
  
  if (!payload.value.daily_end_time) {
    errors.value.daily_end_time = 'End time is required.'
    isValid = false
  } else if (payload.value.daily_start_time && payload.value.daily_end_time <= payload.value.daily_start_time) {
    errors.value.daily_end_time = 'End time must be after start time.'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    await engagementStore.create(payload.value)
    router.push({ name: 'track-admin-engagements' })
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl text-slate-800 font-bold">Create Engagement</h1>
      <p class="text-sm text-slate-500">Schedule a new engagement and auto-generate sessions.</p>
    </div>

    <div class="bg-white shadow-lg rounded-sm border border-slate-200 p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select v-model="payload.type" class="w-full form-select border-slate-300 rounded-md">
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
              <option value="business">Business Session</option>
            </select>
          </div>

          <!-- Cohort -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Cohort</label>
            <select v-model="payload.cohort_id" class="w-full form-select border-slate-300 rounded-md">
              <option value="0" disabled>Select Cohort</option>
              <option v-for="cohort in cohortStore.cohorts" :key="cohort.id" :value="cohort.id">
                {{ cohort.name }}
              </option>
            </select>
            <p v-if="errors.cohort_id" class="text-red-500 text-xs mt-1">{{ errors.cohort_id }}</p>
          </div>

          <!-- Instructor -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
            <select v-model="payload.instructor_id" class="w-full form-select border-slate-300 rounded-md">
              <option value="0" disabled>Select Instructor</option>
              <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
                {{ instructor.name }}
              </option>
            </select>
            <p v-if="errors.instructor_id" class="text-red-500 text-xs mt-1">{{ errors.instructor_id }}</p>
          </div>

          <!-- Scheduled Hours -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Total Scheduled Hours</label>
            <input type="number" v-model="payload.scheduled_hours" class="w-full form-input border-slate-300 rounded-md" min="1" />
            <p v-if="errors.scheduled_hours" class="text-red-500 text-xs mt-1">{{ errors.scheduled_hours }}</p>
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input type="date" v-model="payload.start_date" class="w-full form-input border-slate-300 rounded-md" />
            <p v-if="errors.start_date" class="text-red-500 text-xs mt-1">{{ errors.start_date }}</p>
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input type="date" v-model="payload.end_date" class="w-full form-input border-slate-300 rounded-md" />
            <p v-if="errors.end_date" class="text-red-500 text-xs mt-1">{{ errors.end_date }}</p>
          </div>

          <!-- Daily Start Time -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Session Start Time</label>
            <input type="time" step="1" v-model="payload.daily_start_time" class="w-full form-input border-slate-300 rounded-md" />
            <p v-if="errors.daily_start_time" class="text-red-500 text-xs mt-1">{{ errors.daily_start_time }}</p>
          </div>

          <!-- Daily End Time -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Session End Time</label>
            <input type="time" step="1" v-model="payload.daily_end_time" class="w-full form-input border-slate-300 rounded-md" />
            <p v-if="errors.daily_end_time" class="text-red-500 text-xs mt-1">{{ errors.daily_end_time }}</p>
          </div>
        </div>

        <!-- Days of Week -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Days of Week</label>
          <div class="flex flex-wrap gap-4">
            <label v-for="day in daysOptions" :key="day.value" class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" :value="day.value" v-model="payload.days_of_week" class="form-checkbox text-indigo-500 rounded" />
              <span class="text-sm text-slate-600">{{ day.label }}</span>
            </label>
          </div>
          <p v-if="errors.days_of_week" class="text-red-500 text-xs mt-1">{{ errors.days_of_week }}</p>
        </div>

        <div v-if="engagementStore.error" class="bg-red-50 text-red-600 p-3 rounded text-sm">
          {{ engagementStore.error }}
        </div>

        <div class="flex justify-end gap-3 mt-6 border-t border-slate-200 pt-5">
          <router-link :to="{ name: 'track-admin-engagements' }" class="btn bg-white border-slate-200 hover:border-slate-300 text-slate-600 px-4 py-2 rounded-md font-medium transition-colors duration-150">
            Cancel
          </router-link>
          <button type="submit" :disabled="engagementStore.isLoading" class="btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-colors duration-150 flex items-center gap-2">
            <span v-if="engagementStore.isLoading" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            Create Engagement
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
