<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listTracks } from '@/api/modules/track.api'
import type { Track } from '@/types/cohort.types'
import { RefreshCw, Layers } from '@lucide/vue'

const tracks = ref<Track[]>([])
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

const fetchTracks = async () => {
  isLoading.value = true
  errorMsg.value = null
  try {
    const res = await listTracks()
    tracks.value = res.data.data ?? []
  } catch (e) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'Failed to load tracks'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTracks)
</script>

<template>
  <div class="min-h-screen p-6">
    <div class="mb-8">
      <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Branch Manager</p>
      <h1 class="font-serif text-[36px] text-[#1A0000] leading-tight">Training Tracks</h1>
      <div class="h-[1px] bg-[#C9BDB8] w-full mt-4"></div>
    </div>

    <div v-if="isLoading" class="py-16 text-center">
      <RefreshCw class="w-8 h-8 text-[#940002] animate-spin mx-auto mb-3" />
      <p class="text-sm text-[#666]">Loading tracks...</p>
    </div>

    <div v-else-if="errorMsg" class="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{{ errorMsg }}</div>

    <div v-else-if="tracks.length === 0" class="py-16 text-center">
      <Layers class="w-12 h-12 text-[#C9BDB8] mx-auto mb-3" />
      <p class="text-sm text-[#888]">No tracks found.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="track in tracks" :key="track.id" class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-4">
          <div class="w-10 h-10 rounded-full bg-[#F5EDEA] flex items-center justify-center">
            <Layers class="w-5 h-5 text-[#940002]" />
          </div>
          <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Active</span>
        </div>
        <h3 class="font-serif text-[22px] text-[#1A0000] mb-1">{{ track.name }}</h3>
        <p class="text-sm text-[#666] font-sans">Training track at ITI</p>
      </div>
    </div>
  </div>
</template>
