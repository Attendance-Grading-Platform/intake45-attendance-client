<template>
  <div class="max-w-4xl mx-auto py-8 px-6">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-primary-900 mb-1">Notices</h2>
      <h1 class="font-serif text-4xl text-neutral-900">Announcements</h1>
    </div>

    <!-- Announcements List -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
    </div>
    
    <div v-else-if="announcements.length === 0" class="py-12 text-center text-neutral-500">
      No announcements available at this time.
    </div>

    <div v-else class="space-y-8 divide-y divide-neutral-200">
      <article 
        v-for="announcement in announcements" 
        :key="announcement.id"
        class="pt-8 first:pt-0"
      >
        <!-- Author Info & Date -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <!-- Avatar Initials -->
            <div 
              class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style="background-color: #940002; color: #E6DDD4;"
            >
              {{ getInitials(announcement.author?.name || 'Admin') }}
            </div>
            
            <div>
              <p class="font-bold text-neutral-900 text-sm">{{ announcement.author?.name || 'Administrator' }}</p>
              <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {{ formatRole(announcement.author?.role) }}
              </p>
            </div>
          </div>
          
          <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {{ formatDate(announcement.published_at || announcement.created_at) }}
          </div>
        </div>

        <!-- Content -->
        <div>
          <h3 class="font-serif text-[20px] text-neutral-900 mb-2">
            {{ announcement.title }}
          </h3>
          
          <div 
            class="prose prose-sm max-w-none text-neutral-700"
            :class="{ 'line-clamp-2': !expandedPosts.includes(announcement.id) }"
            v-html="announcement.body"
          >
          </div>
          
          <button 
            @click="toggleExpand(announcement.id)"
            class="mt-3 text-primary-900 font-bold text-xs underline decoration-2 underline-offset-4 hover:text-primary-700 transition-colors"
          >
            {{ expandedPosts.includes(announcement.id) ? 'Show less ←' : 'Read full post →' }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStudentAnnouncements } from '@/api/modules/announcement.api'
import type { Announcement } from '@/types/announcement.types'

const announcements = ref<Announcement[]>([])
const loading = ref(true)
const expandedPosts = ref<number[]>([])

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getStudentAnnouncements()
    announcements.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load announcements:', err)
  } finally {
    loading.value = false
  }
}

const getInitials = (name: string) => {
  if (!name) return 'A'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const formatRole = (role?: string) => {
  if (!role) return 'ADMINISTRATOR'
  return role.replace(/_/g, ' ').toUpperCase()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const toggleExpand = (id: number) => {
  const index = expandedPosts.value.indexOf(id)
  if (index === -1) {
    expandedPosts.value.push(id)
  } else {
    expandedPosts.value.splice(index, 1)
  }
}

onMounted(() => {
  loadAnnouncements()
})
</script>
